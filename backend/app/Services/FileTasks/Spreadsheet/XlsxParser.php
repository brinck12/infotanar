<?php

declare(strict_types=1);

namespace App\Services\FileTasks\Spreadsheet;

use App\Services\Files\XmlSafety;
use App\Services\Files\ZipSafety;
use App\Services\FileTasks\Grammar\Colors;
use App\Services\FileTasks\UnreadableFile;
use DOMElement;
use Illuminate\Support\Facades\Config;
use XMLReader;
use ZipArchive;

/**
 * Egy xlsx (SpreadsheetML) munkafuzet olvasasa a formatumfuggetlen modellbe.
 *
 * A csomagbol semmit nem csomagolunk ki: a reszek a memoriaba kerulnek, a
 * ZipSafety::read korlatjaval. A munkalapokat es a megosztott szovegeket
 * folyamolvasoval (XMLReader) jarjuk be, soronkent kibontva; a kis reszeket
 * (munkafuzet, stilusok, diagramok) DOM-ban olvassuk. A kepletet nem
 * szamoljuk ujra, a fajlba mentett eredmenyt olvassuk.
 */
final readonly class XlsxParser
{
    /** Ennyi munkalapnal tobbet nem olvasunk (az ertekeles ideje korlatos). */
    private const MAX_SHEETS = 100;

    /** Ennyi diagramnal tobbet nem olvasunk. */
    private const MAX_CHARTS = 50;

    /** Az Excel alap oszlopszelessege (8,43 karakter) tarolt alakban. */
    private const DEFAULT_COLUMN_STORED_WIDTH = 9.140625;

    private const DEFAULT_ROW_HEIGHT = 15.0;

    public function __construct(private ZipSafety $zip, private XlsxChartParser $charts) {}

    /** @throws UnreadableFile */
    public function parse(ZipArchive $archive): SpreadsheetModel
    {
        $workbookPath = $this->workbookPath($archive);
        $workbook = XmlSafety::load($this->part($archive, $workbookPath));
        $relationships = $this->relationships($archive, $workbookPath);

        $sheetDefinitions = $this->sheetDefinitions($workbook, $relationships, $workbookPath);

        if ($sheetDefinitions === []) {
            throw new UnreadableFile('A munkafuzetben nincs munkalap.');
        }

        $strings = $this->sharedStrings($archive, $relationships, $workbookPath);
        [$formats, $fills] = $this->styles($archive, $relationships, $workbookPath);
        $printAreas = $this->printAreas($workbook);

        $budget = new CellBudget(Config::integer('filetasks.max_dom_nodes'));
        $sheets = [];
        $charts = [];

        foreach ($sheetDefinitions as $index => [$name, $path]) {
            $sheets[] = $this->sheet($archive, $name, $path, $strings, $formats, $fills, $printAreas[$index] ?? [], $budget);

            if (count($charts) < self::MAX_CHARTS) {
                array_push($charts, ...$this->sheetCharts($archive, $name, $path, self::MAX_CHARTS - count($charts)));
            }
        }

        return new SpreadsheetModel($sheets, $charts);
    }

    /** @throws UnreadableFile */
    private function workbookPath(ZipArchive $archive): string
    {
        $root = $this->zip->read($archive, '_rels/.rels');

        if ($root !== null) {
            foreach (Xml::descendants(XmlSafety::load($root), 'Relationship') as $relationship) {
                $type = Xml::attribute($relationship, 'Type') ?? '';

                if (str_ends_with($type, '/officeDocument') && Xml::attribute($relationship, 'TargetMode') !== 'External') {
                    return $this->resolve('', Xml::attribute($relationship, 'Target') ?? '');
                }
            }
        }

        if ($archive->locateName('xl/workbook.xml') !== false) {
            return 'xl/workbook.xml';
        }

        throw new UnreadableFile('Nincs munkafuzet-resz a csomagban.');
    }

    /** @throws UnreadableFile */
    private function part(ZipArchive $archive, string $path): string
    {
        return $this->zip->read($archive, $path) ?? throw new UnreadableFile("Hianyzo resz: {$path}.");
    }

    /**
     * Egy resz kapcsolatai: azonosito => [tipus, feloldott utvonal]. A kulso
     * (URL-re mutato) kapcsolatokat eldobjuk: URL-t soha nem kerunk le.
     *
     * @return array<string, array{0: string, 1: string}>
     */
    private function relationships(ZipArchive $archive, string $partPath): array
    {
        $directory = dirname($partPath);
        $relsPath = ($directory === '.' ? '' : $directory.'/').'_rels/'.basename($partPath).'.rels';
        $contents = $this->zip->read($archive, $relsPath);

        if ($contents === null) {
            return [];
        }

        $relationships = [];

        foreach (Xml::descendants(XmlSafety::load($contents), 'Relationship') as $relationship) {
            $id = Xml::attribute($relationship, 'Id');
            $target = Xml::attribute($relationship, 'Target');

            if ($id === null || $target === null || Xml::attribute($relationship, 'TargetMode') === 'External') {
                continue;
            }

            $relationships[$id] = [Xml::attribute($relationship, 'Type') ?? '', $this->resolve($directory === '.' ? '' : $directory, $target)];
        }

        return $relationships;
    }

    /** A kapcsolat celja a csomag gyokerehez kepest, `..` nelkul. */
    private function resolve(string $directory, string $target): string
    {
        $segments = str_starts_with($target, '/') ? [] : array_filter(explode('/', $directory), static fn (string $part): bool => $part !== '');

        foreach (explode('/', ltrim($target, '/')) as $part) {
            if ($part === '..') {
                array_pop($segments);
            } elseif ($part !== '' && $part !== '.') {
                $segments[] = $part;
            }
        }

        return implode('/', $segments);
    }

    /**
     * @param  array<string, array{0: string, 1: string}>  $relationships
     * @return list<array{0: string, 1: string}> [munkalap neve, resz utvonala], a munkafuzet sorrendjeben
     */
    private function sheetDefinitions(\DOMDocument $workbook, array $relationships, string $workbookPath): array
    {
        $definitions = [];

        foreach (Xml::descendants($workbook, 'sheet') as $sheet) {
            $name = Xml::attribute($sheet, 'name');
            $id = Xml::attributeByLocalName($sheet, 'id');

            if ($name === null || $id === null || ! isset($relationships[$id])) {
                continue;
            }

            $definitions[] = [$name, $relationships[$id][1]];

            if (count($definitions) >= self::MAX_SHEETS) {
                break;
            }
        }

        return $definitions;
    }

    /**
     * @param  array<string, array{0: string, 1: string}>  $relationships
     * @return list<string>
     */
    private function sharedStrings(ZipArchive $archive, array $relationships, string $workbookPath): array
    {
        $path = $this->targetOfType($relationships, '/sharedStrings');

        if ($path === null) {
            return [];
        }

        $xml = $this->zip->read($archive, $path);

        if ($xml === null) {
            return [];
        }

        $strings = [];
        $limit = Config::integer('filetasks.max_dom_nodes');

        Xml::stream($xml, static function (XMLReader $reader) use (&$strings, $limit): void {
            Xml::eachElement($reader, static function (XMLReader $reader) use (&$strings, $limit): bool {
                if ($reader->localName !== 'si') {
                    return false;
                }

                $item = Xml::expand($reader);
                $strings[] = $item === null ? '' : self::richText($item);

                if (count($strings) > $limit) {
                    throw new UnreadableFile('Tul sok megosztott szoveg.');
                }

                return true;
            });
        });

        return $strings;
    }

    /** Egy `si` vagy `is` elem szovege: a futamok `t` elemei, a fonetikus (`rPh`) resz nelkul. */
    private static function richText(DOMElement $item): string
    {
        $text = '';

        foreach (Xml::children($item) as $child) {
            if ($child->localName === 't') {
                $text .= $child->textContent;
            } elseif ($child->localName === 'r') {
                $run = Xml::child($child, 't');
                $text .= $run->textContent ?? '';
            }
        }

        return $text;
    }

    /**
     * @param  array<string, array{0: string, 1: string}>  $relationships
     * @return array{0: array<int, string>, 1: array<int, string|null>} [stilusindex => szamformatum-kod, dxf-index => kitoltoszin]
     */
    private function styles(ZipArchive $archive, array $relationships, string $workbookPath): array
    {
        $path = $this->targetOfType($relationships, '/styles');
        $xml = $path === null ? null : $this->zip->read($archive, $path);

        if ($xml === null) {
            return [[], []];
        }

        $document = XmlSafety::load($xml);
        $codes = [];

        foreach (Xml::descendants($document, 'numFmt') as $format) {
            $id = Xml::number($format, 'numFmtId');
            $code = Xml::attribute($format, 'formatCode');

            if ($id !== null && $code !== null) {
                $codes[(int) $id] = $code;
            }
        }

        $formats = [];
        $cellXfs = Xml::child($document->documentElement ?? $document, 'cellXfs');

        foreach ($cellXfs === null ? [] : Xml::children($cellXfs, 'xf') as $index => $xf) {
            $id = (int) (Xml::number($xf, 'numFmtId') ?? 0);
            $formats[$index] = $codes[$id] ?? NumberFormatCode::builtin($id);
        }

        $fills = [];
        $dxfs = Xml::child($document->documentElement ?? $document, 'dxfs');

        foreach ($dxfs === null ? [] : Xml::children($dxfs, 'dxf') as $index => $dxf) {
            $fills[$index] = $this->dxfFill($dxf);
        }

        return [$formats, $fills];
    }

    private function dxfFill(DOMElement $dxf): ?string
    {
        $pattern = ($fill = Xml::child($dxf, 'fill')) === null ? null : Xml::child($fill, 'patternFill');

        if ($pattern === null) {
            return null;
        }

        foreach (['bgColor', 'fgColor'] as $name) {
            $color = Xml::child($pattern, $name);
            $rgb = $color === null ? null : Xml::attribute($color, 'rgb');

            if ($rgb !== null && ($canonical = Colors::parse($rgb)) !== null) {
                return $canonical;
            }
        }

        return null;
    }

    /**
     * @param  array<string, array{0: string, 1: string}>  $relationships
     */
    private function targetOfType(array $relationships, string $suffix): ?string
    {
        foreach ($relationships as [$type, $target]) {
            if (str_ends_with($type, $suffix)) {
                return $target;
            }
        }

        return null;
    }

    /**
     * A nyomtatasi teruletek munkalap-index szerint (a `_xlnm.Print_Area` nevek).
     *
     * @return array<int, list<CellRange>>
     */
    private function printAreas(\DOMDocument $workbook): array
    {
        $areas = [];

        foreach (Xml::descendants($workbook, 'definedName') as $name) {
            $sheetIndex = Xml::number($name, 'localSheetId');

            if (Xml::attribute($name, 'name') !== '_xlnm.Print_Area' || $sheetIndex === null) {
                continue;
            }

            foreach (explode(',', $name->textContent) as $part) {
                $reference = CellReference::parse($part);

                if ($reference !== null) {
                    $areas[(int) $sheetIndex][] = $reference->range;
                }
            }
        }

        return $areas;
    }

    /**
     * @param  list<string>  $strings
     * @param  array<int, string>  $formats
     * @param  array<int, string|null>  $fills
     * @param  list<CellRange>  $printAreas
     */
    private function sheet(ZipArchive $archive, string $name, string $path, array $strings, array $formats, array $fills, array $printAreas, CellBudget $budget): Sheet
    {
        $xml = $this->part($archive, $path);

        /** @var array<int, array<int, Cell>> $rows */
        $rows = [];
        /** @var list<AxisSpan> $columns */
        $columns = [];
        /** @var list<AxisSpan> $rowSpans */
        $rowSpans = [];
        /** @var list<ConditionalFormat> $conditional */
        $conditional = [];
        /** @var array<int, array{0: string, 1: int, 2: int}> $sharedFormulas */
        $sharedFormulas = [];
        $defaultWidth = Sheet::storedWidthToMillimetres(self::DEFAULT_COLUMN_STORED_WIDTH);
        $defaultHeight = self::DEFAULT_ROW_HEIGHT;
        $nextRow = 1;

        Xml::stream($xml, function (XMLReader $reader) use (&$rows, &$columns, &$rowSpans, &$conditional, &$sharedFormulas, &$defaultWidth, &$defaultHeight, &$nextRow, $strings, $formats, $fills, $budget): void {
            Xml::eachElement($reader, function (XMLReader $reader) use (&$rows, &$columns, &$rowSpans, &$conditional, &$sharedFormulas, &$defaultWidth, &$defaultHeight, &$nextRow, $strings, $formats, $fills, $budget): bool {
                $name = $reader->localName;
                $element = in_array($name, ['sheetFormatPr', 'col', 'row', 'conditionalFormatting'], true) ? Xml::expand($reader) : null;

                if ($element === null) {
                    return false;
                }

                switch ($name) {
                    case 'sheetFormatPr':
                        $defaultHeight = Xml::number($element, 'defaultRowHeight') ?? $defaultHeight;
                        $width = Xml::number($element, 'defaultColWidth');
                        $defaultWidth = $width !== null ? Sheet::storedWidthToMillimetres($width) : $defaultWidth;

                        return false;

                    case 'col':
                        $first = (int) (Xml::number($element, 'min') ?? 0);
                        $last = (int) (Xml::number($element, 'max') ?? $first);
                        $width = Xml::number($element, 'width');

                        if ($first >= 1 && $last >= $first) {
                            $columns[] = new AxisSpan($first, min($last, CellRange::MAX_COLUMN), $width === null ? null : Sheet::storedWidthToMillimetres($width), Xml::flag($element, 'hidden'));
                        }

                        return false;

                    case 'row':
                        $nextRow = $this->row($element, $nextRow, $rows, $rowSpans, $sharedFormulas, $strings, $formats, $budget);

                        return true;

                    case 'conditionalFormatting':
                        array_push($conditional, ...$this->conditionalFormats($element, $fills));

                        return true;

                    default:
                        return false;
                }
            });
        });

        return new Sheet($name, $rows, $defaultWidth, $defaultHeight, $columns, $rowSpans, $printAreas, $conditional);
    }

    /**
     * Egy `row` elem: a sorszamot adja vissza a kovetkezo sor alapertelmezesehez.
     *
     * @param  array<int, array<int, Cell>>  $rows
     * @param  list<AxisSpan>  $rowSpans
     * @param  array<int, array{0: string, 1: int, 2: int}>  $sharedFormulas
     * @param  list<string>  $strings
     * @param  array<int, string>  $formats
     */
    private function row(DOMElement $row, int $nextRow, array &$rows, array &$rowSpans, array &$sharedFormulas, array $strings, array $formats, CellBudget $budget): int
    {
        $rowIndex = (int) (Xml::number($row, 'r') ?? $nextRow);

        if ($rowIndex < 1 || $rowIndex > CellRange::MAX_ROW) {
            throw new UnreadableFile('Ervenytelen sorszam.');
        }

        $height = Xml::number($row, 'ht');

        if (($height !== null && Xml::flag($row, 'customHeight')) || Xml::flag($row, 'hidden')) {
            $rowSpans[] = new AxisSpan($rowIndex, $rowIndex, Xml::flag($row, 'customHeight') ? $height : null, Xml::flag($row, 'hidden'));
        }

        $nextColumn = 1;

        foreach (Xml::children($row, 'c') as $cell) {
            $reference = Xml::attribute($cell, 'r');
            $address = $reference === null ? null : CellRange::parse($reference);
            $column = $address !== null && $address->isSingleCell() ? $address->firstColumn : $nextColumn;
            $nextColumn = $column + 1;

            $parsed = $this->cell($cell, $column, $rowIndex, $sharedFormulas, $strings, $formats);

            if ($parsed === null) {
                continue;
            }

            $budget->take();
            $rows[$rowIndex][$column] = $parsed;
        }

        return $rowIndex + 1;
    }

    /**
     * @param  array<int, array{0: string, 1: int, 2: int}>  $sharedFormulas
     * @param  list<string>  $strings
     * @param  array<int, string>  $formats
     */
    private function cell(DOMElement $cell, int $column, int $row, array &$sharedFormulas, array $strings, array $formats): ?Cell
    {
        $style = (int) (Xml::number($cell, 's') ?? 0);
        $format = $formats[$style] ?? NumberFormatCode::GENERAL;
        $formula = $this->formula($cell, $column, $row, $sharedFormulas);
        $type = Xml::attribute($cell, 't') ?? 'n';
        $valueElement = Xml::child($cell, 'v');
        $raw = $valueElement?->textContent;

        [$cellType, $value] = match (true) {
            $type === 'inlineStr' => ($inline = Xml::child($cell, 'is')) === null ? [CellType::Blank, null] : [CellType::Text, self::richText($inline)],
            $raw === null || $raw === '' => [CellType::Blank, null],
            $type === 's' => isset($strings[(int) $raw]) ? [CellType::Text, $strings[(int) $raw]] : [CellType::Blank, null],
            $type === 'str' => [CellType::Text, $raw],
            $type === 'b' => [CellType::Boolean, $raw === '1' || strtolower($raw) === 'true'],
            $type === 'e' => [CellType::Error, $raw],
            $type === 'd' => ($serial = SerialDate::fromIso($raw)) === null ? [CellType::Text, $raw] : [CellType::Number, $serial],
            is_numeric($raw) => [CellType::Number, (float) $raw],
            default => [CellType::Text, $raw],
        };

        $formatted = NumberFormatCode::parse($format)->canonical !== NumberFormatCode::parse(NumberFormatCode::GENERAL)->canonical;

        // Az ures, de szamformatumot viselo cella is szamit (a szerzo egy ures tartomanyt is formazhat).
        if ($cellType === CellType::Blank && $formula === null && ! $formatted) {
            return null;
        }

        return new Cell($cellType, $value, $formula, $format);
    }

    /**
     * A cella kepletenek kanonikus alakja; a megosztott keplet gyermekei a
     * mester kepletebol szarmaznak (a hivatkozasok eltolasaval).
     *
     * @param  array<int, array{0: string, 1: int, 2: int}>  $shared
     */
    private function formula(DOMElement $cell, int $column, int $row, array &$shared): ?string
    {
        $element = Xml::child($cell, 'f');

        if ($element === null) {
            return null;
        }

        $text = trim($element->textContent);

        if (Xml::attribute($element, 't') === 'shared') {
            $index = (int) (Xml::number($element, 'si') ?? -1);

            if ($text !== '') {
                $canonical = FormulaNormalizer::fromSpreadsheetMl($text);
                $shared[$index] = [$canonical, $column, $row];

                return $canonical;
            }

            if (isset($shared[$index])) {
                [$master, $masterColumn, $masterRow] = $shared[$index];

                return FormulaNormalizer::shift($master, $column - $masterColumn, $row - $masterRow);
            }

            return null;
        }

        return $text === '' ? null : FormulaNormalizer::fromSpreadsheetMl($text);
    }

    /**
     * @param  array<int, string|null>  $fills
     * @return list<ConditionalFormat>
     */
    private function conditionalFormats(DOMElement $block, array $fills): array
    {
        $ranges = [];

        foreach (preg_split('/\s+/', trim(Xml::attribute($block, 'sqref') ?? '')) ?: [] as $part) {
            $range = CellRange::parse($part);

            if ($range !== null) {
                $ranges[] = $range;
            }
        }

        if ($ranges === []) {
            return [];
        }

        $formats = [];

        foreach (Xml::children($block, 'cfRule') as $rule) {
            $arguments = array_map(
                static fn (DOMElement $formula): string => self::unquote(trim($formula->textContent)),
                Xml::children($rule, 'formula'),
            );
            $dxf = Xml::number($rule, 'dxfId');
            $kind = $this->ruleKind($rule, $arguments);

            $formats[] = new ConditionalFormat($ranges, $kind[0], $kind[1], $dxf === null ? null : ($fills[(int) $dxf] ?? null));
        }

        return $formats;
    }

    /**
     * @param  list<string>  $arguments
     * @return array{0: string, 1: list<string>}
     */
    private function ruleKind(DOMElement $rule, array $arguments): array
    {
        $operator = Xml::attribute($rule, 'operator') ?? '';
        $text = Xml::attribute($rule, 'text') ?? '';

        return match (Xml::attribute($rule, 'type') ?? '') {
            'cellIs' => [match ($operator) {
                'greaterThan' => ConditionalFormat::GREATER_THAN,
                'lessThan' => ConditionalFormat::LESS_THAN,
                'greaterThanOrEqual' => ConditionalFormat::GREATER_OR_EQUAL,
                'lessThanOrEqual' => ConditionalFormat::LESS_OR_EQUAL,
                'equal' => ConditionalFormat::EQUAL,
                'notEqual' => ConditionalFormat::NOT_EQUAL,
                'between' => ConditionalFormat::BETWEEN,
                'notBetween' => ConditionalFormat::NOT_BETWEEN,
                default => ConditionalFormat::OTHER,
            }, $arguments],
            'containsText' => [ConditionalFormat::CONTAINS_TEXT, [$text]],
            'beginsWith' => [ConditionalFormat::BEGINS_WITH, [$text]],
            'endsWith' => [ConditionalFormat::ENDS_WITH, [$text]],
            'top10' => [Xml::flag($rule, 'bottom') ? ConditionalFormat::BOTTOM : ConditionalFormat::TOP, [(string) (int) (Xml::number($rule, 'rank') ?? 10)]],
            'aboveAverage' => [Xml::flag($rule, 'aboveAverage', true) ? ConditionalFormat::ABOVE_AVERAGE : ConditionalFormat::BELOW_AVERAGE, []],
            'duplicateValues' => [ConditionalFormat::DUPLICATE, []],
            'uniqueValues' => [ConditionalFormat::UNIQUE, []],
            'expression' => [ConditionalFormat::FORMULA, array_map(FormulaNormalizer::canonical(...), $arguments)],
            'colorScale' => [ConditionalFormat::COLOR_SCALE, []],
            'dataBar' => [ConditionalFormat::DATA_BAR, []],
            'iconSet' => [ConditionalFormat::ICON_SET, []],
            default => [ConditionalFormat::OTHER, []],
        };
    }

    /** A szoveges kuszobertek idezojelei nelkul ("abc" => abc); minden mas valtozatlan. */
    private static function unquote(string $argument): string
    {
        return strlen($argument) >= 2 && str_starts_with($argument, '"') && str_ends_with($argument, '"')
            ? str_replace('""', '"', substr($argument, 1, -1))
            : $argument;
    }

    /**
     * A munkalap diagramjai a rajzokon at.
     *
     * @return list<Chart>
     */
    private function sheetCharts(ZipArchive $archive, string $sheetName, string $sheetPath, int $limit): array
    {
        $charts = [];

        foreach ($this->relationships($archive, $sheetPath) as [$type, $drawingPath]) {
            if (! str_ends_with($type, '/drawing')) {
                continue;
            }

            $drawing = $this->zip->read($archive, $drawingPath);

            if ($drawing === null) {
                continue;
            }

            $drawingRelationships = $this->relationships($archive, $drawingPath);

            foreach (Xml::descendants(XmlSafety::load($drawing), 'chart') as $reference) {
                $id = Xml::attributeByLocalName($reference, 'id');
                $chartPath = $id === null ? null : ($drawingRelationships[$id][1] ?? null);
                $xml = $chartPath === null ? null : $this->zip->read($archive, $chartPath);

                if ($xml === null) {
                    continue;
                }

                $charts[] = $this->charts->parse(XmlSafety::load($xml), $sheetName);

                if (count($charts) >= $limit) {
                    return $charts;
                }
            }
        }

        return $charts;
    }
}
