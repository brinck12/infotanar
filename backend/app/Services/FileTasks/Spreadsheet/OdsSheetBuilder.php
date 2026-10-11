<?php

declare(strict_types=1);

namespace App\Services\FileTasks\Spreadsheet;

use App\Services\FileTasks\Grammar\Numbers;
use DOMElement;

/**
 * Az ods content.xml bejarasanak allapota: a folyamolvaso elemenkent hivja,
 * az aktualis munkalap adatait gyujti, a `finish()` adja a kesz lapokat.
 * Allapotos (nem readonly), egy beolvasashoz egy peldany tartozik.
 */
final class OdsSheetBuilder
{
    private const DEFAULT_COLUMN_MILLIMETRES = 22.58;

    private const DEFAULT_ROW_HEIGHT = 12.8;

    /** @var list<array{0: string, 1: string}> [munkalap neve, beagyazott objektum utvonala] */
    public array $objects = [];

    /** @var list<Sheet> */
    private array $sheets = [];

    private ?string $name = null;

    /** @var array<int, array<int, Cell>> */
    private array $rows = [];

    /** @var list<AxisSpan> */
    private array $columns = [];

    /** @var list<AxisSpan> */
    private array $rowSpans = [];

    /** @var list<CellRange> */
    private array $printAreas = [];

    /** @var list<ConditionalFormat> */
    private array $conditional = [];

    /** @var list<array{0: int, 1: int, 2: string}> [elso oszlop, utolso oszlop, alapertelmezett cellastilus] */
    private array $columnStyles = [];

    private int $nextColumn = 1;

    private int $nextRow = 1;

    public function __construct(public readonly OdsStyles $styles, private readonly CellBudget $budget) {}

    public function beginTable(?string $name, ?string $printRanges): bool
    {
        $this->closeTable();

        $this->name = $name ?? 'Munka'.(count($this->sheets) + 1);
        $this->printAreas = [];

        foreach (preg_split('/\s+/', trim($printRanges ?? '')) ?: [] as $part) {
            $range = self::range($part);

            if ($range !== null) {
                $this->printAreas[] = $range;
            }
        }

        return false;
    }

    public function column(int $repeated, ?string $style, ?string $defaultCellStyle, ?string $visibility): bool
    {
        $first = $this->nextColumn;
        $last = min(CellRange::MAX_COLUMN, $first + max(1, $repeated) - 1);
        $this->nextColumn = $first + max(1, $repeated);

        if ($first > CellRange::MAX_COLUMN) {
            return false;
        }

        $hidden = $visibility === 'collapse' || $visibility === 'filter';
        $width = $this->styles->columnWidth($style);

        if ($width !== null || $hidden) {
            $this->columns[] = new AxisSpan($first, $last, $width, $hidden);
        }

        if ($defaultCellStyle !== null) {
            $this->columnStyles[] = [$first, $last, $defaultCellStyle];
        }

        return false;
    }

    public function row(?DOMElement $row): bool
    {
        if ($row === null) {
            return true;
        }

        $repeated = max(1, min(CellRange::MAX_ROW, (int) (OdfNs::attribute($row, OdfNs::TABLE, 'number-rows-repeated') ?? 1)));
        $first = $this->nextRow;
        $this->nextRow += $repeated;

        $this->collectObjects($row);

        $cells = $this->cells($row);

        $style = OdfNs::attribute($row, OdfNs::TABLE, 'style-name');
        $visibility = OdfNs::attribute($row, OdfNs::TABLE, 'visibility');
        $hidden = $visibility === 'collapse' || $visibility === 'filter';
        $height = $this->styles->rowHeight($style);

        if (($height !== null || $hidden) && $first <= CellRange::MAX_ROW) {
            $this->rowSpans[] = new AxisSpan($first, min(CellRange::MAX_ROW, $first + $repeated - 1), $height, $hidden);
        }

        if ($cells === []) {
            return true;
        }

        $this->budget->take(count($cells) * $repeated);

        for ($offset = 0; $offset < $repeated && $first + $offset <= CellRange::MAX_ROW; $offset++) {
            $this->rows[$first + $offset] = $cells;
        }

        return true;
    }

    public function conditionalFormats(?DOMElement $container): bool
    {
        if ($container === null) {
            return true;
        }

        foreach (OdfNs::children($container, OdfNs::CALCEXT, 'conditional-format') as $format) {
            $ranges = [];

            foreach (preg_split('/\s+/', trim(OdfNs::attribute($format, OdfNs::CALCEXT, 'target-range-address') ?? '')) ?: [] as $part) {
                $range = self::range($part);

                if ($range !== null) {
                    $ranges[] = $range;
                }
            }

            if ($ranges === []) {
                continue;
            }

            foreach ($format->childNodes as $rule) {
                if (! $rule instanceof DOMElement || $rule->namespaceURI !== OdfNs::CALCEXT) {
                    continue;
                }

                $this->conditional[] = match ($rule->localName) {
                    'condition' => $this->condition($rule, $ranges),
                    'color-scale' => new ConditionalFormat($ranges, ConditionalFormat::COLOR_SCALE),
                    'data-bar' => new ConditionalFormat($ranges, ConditionalFormat::DATA_BAR),
                    'icon-set' => new ConditionalFormat($ranges, ConditionalFormat::ICON_SET),
                    default => new ConditionalFormat($ranges, ConditionalFormat::OTHER),
                };
            }
        }

        return true;
    }

    public function object(?string $href): bool
    {
        if ($href !== null && $this->name !== null) {
            $this->objects[] = [$this->name, $href];
        }

        return false;
    }

    /** @return list<Sheet> */
    public function finish(): array
    {
        $this->closeTable();

        return $this->sheets;
    }

    private function closeTable(): void
    {
        if ($this->name !== null) {
            $this->sheets[] = new Sheet(
                $this->name,
                $this->rows,
                self::DEFAULT_COLUMN_MILLIMETRES,
                self::DEFAULT_ROW_HEIGHT,
                $this->columns,
                $this->rowSpans,
                $this->printAreas,
                $this->conditional,
            );
        }

        $this->name = null;
        $this->rows = [];
        $this->columns = [];
        $this->rowSpans = [];
        $this->conditional = [];
        $this->columnStyles = [];
        $this->nextColumn = 1;
        $this->nextRow = 1;
    }

    /** @return array<int, Cell> oszlop => cella */
    private function cells(DOMElement $row): array
    {
        $cells = [];
        $column = 1;

        foreach ($row->childNodes as $element) {
            if (! $element instanceof DOMElement || $element->namespaceURI !== OdfNs::TABLE) {
                continue;
            }

            if ($element->localName !== 'table-cell' && $element->localName !== 'covered-table-cell') {
                continue;
            }

            $repeated = max(1, min(CellRange::MAX_COLUMN, (int) (OdfNs::attribute($element, OdfNs::TABLE, 'number-columns-repeated') ?? 1)));
            $cell = $element->localName === 'table-cell' ? $this->cell($element, $column) : null;

            if ($cell !== null) {
                for ($offset = 0; $offset < $repeated && $column + $offset <= CellRange::MAX_COLUMN; $offset++) {
                    $cells[$column + $offset] = $cell;
                }
            }

            $column += $repeated;
        }

        return $cells;
    }

    private function cell(DOMElement $element, int $column): ?Cell
    {
        $style = OdfNs::attribute($element, OdfNs::TABLE, 'style-name') ?? $this->columnStyle($column);
        $format = $this->styles->format($style);
        $formulaAttribute = OdfNs::attribute($element, OdfNs::TABLE, 'formula');
        $formula = $formulaAttribute === null || trim($formulaAttribute) === '' ? null : FormulaNormalizer::fromOpenFormula($formulaAttribute);

        [$type, $value] = $this->value($element);

        // Az ures, de szamformatumot viselo cella is szamit (a szerzo egy ures tartomanyt is formazhat).
        $formatted = NumberFormatCode::parse($format)->canonical !== NumberFormatCode::parse(NumberFormatCode::GENERAL)->canonical
            && OdfNs::attribute($element, OdfNs::TABLE, 'style-name') !== null;

        if ($type === CellType::Blank && $formula === null && ! $formatted) {
            return null;
        }

        return new Cell($type, $value, $formula, $format);
    }

    /** @return array{0: CellType, 1: float|string|bool|null} */
    private function value(DOMElement $element): array
    {
        $kind = OdfNs::attribute($element, OdfNs::OFFICE, 'value-type');

        if (OdfNs::attribute($element, OdfNs::CALCEXT, 'value-type') === 'error') {
            return [CellType::Error, OdfNs::textOf($element)];
        }

        return match ($kind) {
            'float', 'percentage', 'currency' => ($number = OdfNs::attribute($element, OdfNs::OFFICE, 'value')) !== null && is_numeric($number)
                ? [CellType::Number, (float) $number]
                : [CellType::Blank, null],
            'date' => ($serial = SerialDate::fromIso(OdfNs::attribute($element, OdfNs::OFFICE, 'date-value') ?? '')) === null
                ? [CellType::Blank, null]
                : [CellType::Number, $serial],
            'time' => ($serial = SerialDate::fromDuration(OdfNs::attribute($element, OdfNs::OFFICE, 'time-value') ?? '')) === null
                ? [CellType::Blank, null]
                : [CellType::Number, $serial],
            'boolean' => [CellType::Boolean, OdfNs::attribute($element, OdfNs::OFFICE, 'boolean-value') === 'true'],
            'string' => [CellType::Text, OdfNs::attribute($element, OdfNs::OFFICE, 'string-value') ?? OdfNs::textOf($element)],
            default => [CellType::Blank, null],
        };
    }

    private function columnStyle(int $column): ?string
    {
        foreach ($this->columnStyles as [$first, $last, $style]) {
            if ($column >= $first && $column <= $last) {
                return $style;
            }
        }

        return null;
    }

    private function collectObjects(DOMElement $row): void
    {
        foreach ($row->getElementsByTagNameNS(OdfNs::DRAW, 'object') as $object) {
            $href = $object->getAttributeNS(OdfNs::XLINK, 'href');

            if ($href !== '' && $this->name !== null) {
                $this->objects[] = [$this->name, $href];
            }
        }
    }

    /** @param  list<CellRange>  $ranges */
    private function condition(DOMElement $rule, array $ranges): ConditionalFormat
    {
        $value = trim(OdfNs::attribute($rule, OdfNs::CALCEXT, 'value') ?? '');
        $fill = $this->styles->fill(OdfNs::attribute($rule, OdfNs::CALCEXT, 'apply-style-name'));
        [$kind, $arguments] = self::ruleOf($value);

        return new ConditionalFormat($ranges, $kind, $arguments, $fill);
    }

    /**
     * Az ODF felteteles formazas feltetel-szovege ("cell-content()>50") szabalyfajtava es kuszobertekke.
     *
     * @return array{0: string, 1: list<string>}
     */
    private static function ruleOf(string $value): array
    {
        $operators = [
            '>=' => ConditionalFormat::GREATER_OR_EQUAL, '<=' => ConditionalFormat::LESS_OR_EQUAL,
            '!=' => ConditionalFormat::NOT_EQUAL, '<>' => ConditionalFormat::NOT_EQUAL,
            '>' => ConditionalFormat::GREATER_THAN, '<' => ConditionalFormat::LESS_THAN,
            '=' => ConditionalFormat::EQUAL,
        ];

        if (preg_match('/^cell-content\(\)\s*(>=|<=|!=|<>|>|<|=)\s*(.+)$/s', $value, $match) === 1) {
            return [$operators[$match[1]], [self::argument($match[2])]];
        }

        if (preg_match('/^cell-content-is-(not-)?between\((.*)\)$/s', $value, $match) === 1) {
            $parts = array_map(self::argument(...), explode(',', $match[2]));

            return [$match[1] === 'not-' ? ConditionalFormat::NOT_BETWEEN : ConditionalFormat::BETWEEN, $parts];
        }

        if (preg_match('/^(is-true-formula|formula-is)\((.*)\)$/s', $value, $match) === 1) {
            return [ConditionalFormat::FORMULA, [FormulaNormalizer::canonical($match[2])]];
        }

        if (preg_match('/^(contains-text|begins-with|ends-with)\((.*)\)$/s', $value, $match) === 1) {
            return [match ($match[1]) {
                'contains-text' => ConditionalFormat::CONTAINS_TEXT,
                'begins-with' => ConditionalFormat::BEGINS_WITH,
                default => ConditionalFormat::ENDS_WITH,
            }, [self::argument($match[2])]];
        }

        if (preg_match('/^(top|bottom)-elements\((.*)\)$/s', $value, $match) === 1) {
            return [$match[1] === 'top' ? ConditionalFormat::TOP : ConditionalFormat::BOTTOM, [self::argument($match[2])]];
        }

        return match (true) {
            str_starts_with($value, 'above-average') => [ConditionalFormat::ABOVE_AVERAGE, []],
            str_starts_with($value, 'below-average') => [ConditionalFormat::BELOW_AVERAGE, []],
            str_starts_with($value, 'duplicate') => [ConditionalFormat::DUPLICATE, []],
            str_starts_with($value, 'unique') => [ConditionalFormat::UNIQUE, []],
            default => [ConditionalFormat::OTHER, []],
        };
    }

    /** Kuszobertek idezojel nelkul; a szam szam marad, a szoveg szoveg. */
    private static function argument(string $text): string
    {
        $text = trim($text);

        if (strlen($text) >= 2 && str_starts_with($text, '"') && str_ends_with($text, '"')) {
            return str_replace('""', '"', substr($text, 1, -1));
        }

        $number = Numbers::parse($text);

        return $number === null ? $text : Numbers::format($number);
    }

    /** "Sheet1.B2:Sheet1.B20" vagy "$Sheet1.$A$1:.$F$30" => tartomany (a munkalap neve nem szamit: a tartomany a sajat lapjan van). */
    private static function range(string $text): ?CellRange
    {
        $cell = '\$?[A-Za-z]{1,3}\$?[0-9]{1,7}';
        $sheet = '(?:\$?(?:\'[^\']*\'|[^.:\']*)\.)?';

        if (preg_match('/^'.$sheet.'('.$cell.')(?::'.$sheet.'('.$cell.'))?$/', $text, $match) !== 1) {
            return null;
        }

        return CellRange::parse($match[1].':'.($match[2] ?? $match[1]));
    }
}
