<?php

declare(strict_types=1);

namespace App\Services\FileTasks\Document;

use App\Services\Files\XmlSafety;
use App\Services\Files\ZipSafety;
use App\Services\FileTasks\Grammar\Colors;
use App\Services\FileTasks\UnreadableFile;
use DOMElement;
use DOMXPath;
use ZipArchive;

/**
 * Word-dokumentum (docx) értelmezése DocumentModell-lé. Egyszer használatos:
 * példányonként egy fájl. Csak a memóriában dolgozik (ZipSafety::read), a
 * XML-t az XmlSafety-n át tölti be, makrót, hivatkozást nem követ.
 */
final class DocxParser
{
    private const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

    private const WP = 'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing';

    private const A = 'http://schemas.openxmlformats.org/drawingml/2006/main';

    private const PIC = 'http://schemas.openxmlformats.org/drawingml/2006/picture';

    /** Az "alapja" lánc és az egymásba ágyazott tartalom mélységi korlátja. */
    private const MAX_DEPTH = 24;

    private DOMXPath $xpath;

    private StyleResolver $resolver;

    /** @var array<string, DOMElement> */
    private array $styleElements = [];

    /** @var array<string, array<int, array{string, string}>> numId => szint => [formátum, szöveg] */
    private array $numbering = [];

    private bool $autoHyphenation = false;

    /** @var array{major: ?string, minor: ?string} */
    private array $themeFonts = ['major' => null, 'minor' => null];

    /** @var list<ParagraphInfo> */
    private array $paragraphs = [];

    /** @var list<SectionInfo> */
    private array $sections = [];

    /** @var list<TableInfo> */
    private array $tables = [];

    /** @var list<ImageInfo> */
    private array $images = [];

    private ?SectionInfo $firstSection = null;

    public function __construct(
        private readonly ZipArchive $zip,
        private readonly ZipSafety $zips,
    ) {}

    /** @throws UnreadableFile */
    public function parse(): DocumentModel
    {
        $documentXml = $this->zips->read($this->zip, 'word/document.xml')
            ?? throw new UnreadableFile('Hiányzik a word/document.xml.');

        $namespaces = ['w' => self::W, 'wp' => self::WP, 'a' => self::A, 'pic' => self::PIC];
        $document = XmlSafety::load($documentXml);
        $this->xpath = Dom::xpath($document, $namespaces);

        $this->loadTheme($namespaces);
        $this->loadSettings();
        $this->loadNumbering($namespaces);
        $this->loadStyles($namespaces);

        $firstSectPr = Dom::first($this->xpath, '(//w:sectPr)[1]');
        $this->firstSection = $firstSectPr === null ? null : $this->section($firstSectPr);

        $body = Dom::first($this->xpath, '/w:document/w:body')
            ?? throw new UnreadableFile('Hiányzik a dokumentum törzse.');

        $this->walk($body, false, 0);

        $bodySectPr = Dom::child($body, 'sectPr');

        if ($bodySectPr !== null) {
            $this->sections[] = $this->section($bodySectPr);
        }

        $sections = $this->sections === [] ? [new SectionInfo(null, null, null, null, null, null, 1, 'page')] : $this->sections;

        return new DocumentModel(
            'docx',
            $this->paragraphs,
            $sections,
            $this->tables,
            $this->images,
            $this->definedStyleNames(),
            $this->paragraphFor(null, $this->resolver->paragraph(null)),
            $this->resolver,
        );
    }

    // --- Tartalom ---------------------------------------------------------

    private function walk(DOMElement $parent, bool $nested, int $depth): void
    {
        if ($depth > self::MAX_DEPTH) {
            throw new UnreadableFile('A dokumentum szerkezete túl mélyen ágyazott.');
        }

        foreach (Dom::children($parent) as $child) {
            match ($child->localName) {
                'p' => $this->paragraph($child),
                'tbl' => $this->table($child, $nested, $depth),
                'sdt' => $this->walkSdt($child, $nested, $depth),
                default => null,
            };
        }
    }

    private function walkSdt(DOMElement $sdt, bool $nested, int $depth): void
    {
        $content = Dom::child($sdt, 'sdtContent');

        if ($content !== null) {
            $this->walk($content, $nested, $depth + 1);
        }
    }

    private function paragraph(DOMElement $paragraph): void
    {
        $pPr = Dom::child($paragraph, 'pPr');
        $styleId = Dom::attr(Dom::child($pPr, 'pStyle'), self::W, 'val');
        $direct = $pPr === null ? new Props : $this->paragraphProps($pPr);

        $base = $this->resolver->paragraph($styleId)->overlay($direct);
        $base = $base->with('hyphenation', $this->autoHyphenation && $base->bool('suppress_hyphens') !== true);

        $runs = [];
        $text = '';

        $runElements = Dom::elements(
            $this->xpath,
            './w:r | ./w:hyperlink/w:r | ./w:ins/w:r | ./w:smartTag/w:r | ./w:fldSimple/w:r | ./w:sdt/w:sdtContent/w:r',
            $paragraph,
        );

        foreach ($runElements as $run) {
            $runText = $this->runText($run);
            $rPr = Dom::child($run, 'rPr');
            $runStyle = Dom::attr(Dom::child($rPr, 'rStyle'), self::W, 'val');
            $props = $this->resolver->withCharacterStyle($base, $runStyle)
                ->overlay($rPr === null ? new Props : $this->characterProps($rPr));

            if (trim($runText) !== '') {
                $runs[] = new RunInfo($runText, $props);
            }

            $text .= $runText;

            foreach (Dom::elements($this->xpath, './/w:drawing', $run) as $drawing) {
                $this->image($drawing);
            }
        }

        $this->paragraphs[] = $this->paragraphFor($styleId, $base, $text, $runs);

        $sectPr = Dom::child($pPr, 'sectPr');

        if ($sectPr !== null) {
            $this->sections[] = $this->section($sectPr);
        }
    }

    /** @param  list<RunInfo>  $runs */
    private function paragraphFor(?string $styleId, Props $base, string $text = '', array $runs = []): ParagraphInfo
    {
        $effectiveId = $styleId ?? $this->resolver->defaultParagraphStyleId();
        $style = $effectiveId === null ? null : $this->resolver->find($effectiveId);

        if ($runs === []) {
            $runs = [new RunInfo('', $base)];
        }

        return new ParagraphInfo(
            $text,
            $effectiveId,
            $style->name ?? ($effectiveId ?? ''),
            $this->resolver->headingLevel($effectiveId),
            $base,
            $runs,
            $this->listOf($base),
        );
    }

    private function runText(DOMElement $run): string
    {
        $text = '';

        foreach (Dom::children($run) as $part) {
            $text .= match ($part->localName) {
                't' => $part->textContent,
                'tab' => "\t",
                'br', 'cr' => "\n",
                'noBreakHyphen' => '-',
                default => '',
            };
        }

        return $text;
    }

    private function listOf(Props $props): ?ListInfo
    {
        $numId = $props->string('num_id');

        if ($numId === null || $numId === '0') {
            return null;
        }

        $level = (int) ($props->float('num_level') ?? 0.0);
        [$format, $text] = $this->numbering[$numId][$level] ?? [null, null];

        if ($format === null || $format === 'none') {
            return null;
        }

        return $format === 'bullet'
            ? new ListInfo('bullet', $level + 1, self::normalizeBullet($text ?? ''))
            : new ListInfo('number', $level + 1, $text ?? '');
    }

    /** A Symbol/Wingdings betűtípus privát kódpontjai helyett a látható jel. */
    public static function normalizeBullet(string $symbol): string
    {
        return match ($symbol) {
            "\u{F0B7}" => '•',
            "\u{F0A7}" => '▪',
            "\u{F0D8}" => '➢',
            "\u{F0FC}" => '✓',
            "\u{F076}" => '❖',
            default => $symbol,
        };
    }

    // --- Képek ---------------------------------------------------------------

    private function image(DOMElement $drawing): void
    {
        if (Dom::first($this->xpath, './/pic:pic', $drawing) === null) {
            return;
        }

        $holder = Dom::first($this->xpath, './wp:inline | ./wp:anchor', $drawing);
        $extent = Dom::first($this->xpath, './wp:extent', $holder ?? $drawing);

        if ($holder === null || $extent === null) {
            return;
        }

        $docPr = Dom::first($this->xpath, './wp:docPr', $holder);
        $alt = $docPr?->getAttribute('descr') ?? '';

        if ($alt === '') {
            $alt = $docPr?->getAttribute('title') ?? '';
        }

        $this->images[] = new ImageInfo(
            Units::emuToMillimetres((float) $extent->getAttribute('cx')),
            Units::emuToMillimetres((float) $extent->getAttribute('cy')),
            $holder->localName === 'inline' ? 'inline' : $this->wrapOf($holder),
            $alt,
        );
    }

    private function wrapOf(DOMElement $anchor): string
    {
        foreach (Dom::children($anchor) as $child) {
            switch ($child->localName) {
                case 'wrapSquare':
                    return 'square';
                case 'wrapTight':
                    return 'tight';
                case 'wrapThrough':
                    return 'through';
                case 'wrapTopAndBottom':
                    return 'topbottom';
                case 'wrapNone':
                    return $this->isTrue($anchor->getAttribute('behindDoc')) ? 'behind' : 'front';
            }
        }

        return 'none';
    }

    // --- Táblázatok --------------------------------------------------------

    private function table(DOMElement $table, bool $nested, int $depth): void
    {
        if (! $nested) {
            $this->tables[] = $this->tableInfo($table);
        }

        foreach (Dom::children($table, 'tr') as $row) {
            foreach (Dom::children($row, 'tc') as $cell) {
                $this->walk($cell, true, $depth + 1);
            }
        }
    }

    private function tableInfo(DOMElement $table): TableInfo
    {
        $rows = Dom::children($table, 'tr');
        $tblPr = Dom::child($table, 'tblPr');
        $gridColumns = array_map(
            static fn (DOMElement $column): float => (float) $column->getAttributeNS(self::W, 'w'),
            Dom::children(Dom::child($table, 'tblGrid') ?? $table, 'gridCol'),
        );

        $maxSpan = 0;
        $height = null;
        $fills = [];
        $cellBorders = false;

        foreach ($rows as $row) {
            $cells = Dom::children($row, 'tc');
            $span = 0;

            foreach ($cells as $cell) {
                $tcPr = Dom::child($cell, 'tcPr');
                $span += (int) (Dom::attr(Dom::child($tcPr, 'gridSpan'), self::W, 'val') ?? 1);
                $fill = Dom::attr(Dom::child($tcPr, 'shd'), self::W, 'fill');

                if ($fill !== null && preg_match('/^[0-9a-fA-F]{6}$/', $fill) === 1 && ! in_array(strtoupper($fill), $fills, true)) {
                    $fills[] = strtoupper($fill);
                }

                $borders = Dom::child($tcPr, 'tcBorders');
                $cellBorders = $cellBorders || ($borders !== null && $this->bordersVisible($borders));
            }

            $maxSpan = max($maxSpan, $span);

            $rowHeight = Dom::attr(Dom::child(Dom::child($row, 'trPr'), 'trHeight'), self::W, 'val');

            if ($rowHeight !== null) {
                $height = ($height ?? 0.0) + Units::twipsToMillimetres((float) $rowHeight);
            }
        }

        $columns = $gridColumns === [] ? $maxSpan : count($gridColumns);
        $tableBorders = Dom::child($tblPr, 'tblBorders');
        $styleId = Dom::attr(Dom::child($tblPr, 'tblStyle'), self::W, 'val');
        $border = $cellBorders
            || ($tableBorders !== null && $this->bordersVisible($tableBorders))
            || ($styleId !== null && $this->styleHasBorders($styleId));

        $tableFill = Dom::attr(Dom::child($tblPr, 'shd'), self::W, 'fill');

        if ($tableFill !== null && preg_match('/^[0-9a-fA-F]{6}$/', $tableFill) === 1 && ! in_array(strtoupper($tableFill), $fills, true)) {
            $fills[] = strtoupper($tableFill);
        }

        $alignment = match (Dom::attr(Dom::child($tblPr, 'jc'), self::W, 'val')) {
            'center' => 'center',
            'right', 'end' => 'right',
            default => 'left',
        };

        return new TableInfo(count($rows), $columns, $border, $this->tableWidth($tblPr, $gridColumns), $height, $fills, $alignment);
    }

    /** @param  list<float>  $gridColumns */
    private function tableWidth(?DOMElement $tblPr, array $gridColumns): ?float
    {
        $width = Dom::child($tblPr, 'tblW');
        $value = Dom::attr($width, self::W, 'w');
        $type = Dom::attr($width, self::W, 'type') ?? 'dxa';

        if ($value !== null && $type === 'dxa' && (float) $value > 0) {
            return Units::twipsToMillimetres((float) $value);
        }

        if ($value !== null && $type === 'pct' && $this->firstSection?->widthMm !== null) {
            $fraction = str_ends_with($value, '%') ? (float) $value / 100 : (float) $value / 5000;
            $text = $this->firstSection->widthMm - ($this->firstSection->marginLeftMm ?? 0.0) - ($this->firstSection->marginRightMm ?? 0.0);

            return $text * $fraction;
        }

        return $gridColumns === [] ? null : Units::twipsToMillimetres(array_sum($gridColumns));
    }

    private function bordersVisible(DOMElement $borders): bool
    {
        foreach (Dom::children($borders) as $edge) {
            $value = Dom::attr($edge, self::W, 'val');

            if ($value !== null && ! in_array(strtolower($value), ['nil', 'none'], true)) {
                return true;
            }
        }

        return false;
    }

    private function styleHasBorders(string $styleId): bool
    {
        for ($depth = 0; $depth < self::MAX_DEPTH && isset($this->styleElements[$styleId]); $depth++) {
            $style = $this->styleElements[$styleId];
            $borders = Dom::child(Dom::child($style, 'tblPr'), 'tblBorders');

            if ($borders !== null && $this->bordersVisible($borders)) {
                return true;
            }

            $styleId = Dom::attr(Dom::child($style, 'basedOn'), self::W, 'val') ?? '';
        }

        return false;
    }

    // --- Szakaszok -----------------------------------------------------------

    private function section(DOMElement $sectPr): SectionInfo
    {
        $size = Dom::child($sectPr, 'pgSz');
        $margins = Dom::child($sectPr, 'pgMar');
        $twips = static fn (?DOMElement $element, string $name): ?float => ($value = Dom::attr($element, self::W, $name)) === null
            ? null
            : Units::twipsToMillimetres((float) $value);

        $columns = (int) (Dom::attr(Dom::child($sectPr, 'cols'), self::W, 'num') ?? 1);

        return new SectionInfo(
            $twips($size, 'w'),
            $twips($size, 'h'),
            $twips($margins, 'top'),
            $twips($margins, 'bottom'),
            $twips($margins, 'left'),
            $twips($margins, 'right'),
            max(1, $columns),
            match (Dom::attr(Dom::child($sectPr, 'type'), self::W, 'val')) {
                'continuous' => 'continuous',
                'evenPage' => 'even',
                'oddPage' => 'odd',
                default => 'page',
            },
        );
    }

    // --- Formázás --------------------------------------------------------------

    private function characterProps(DOMElement $rPr): Props
    {
        $props = new Props;
        $fonts = Dom::child($rPr, 'rFonts');

        if ($fonts !== null) {
            $theme = Dom::attr($fonts, self::W, 'asciiTheme') ?? Dom::attr($fonts, self::W, 'hAnsiTheme');
            $themed = $theme === null ? null : (str_starts_with($theme, 'major') ? $this->themeFonts['major'] : $this->themeFonts['minor']);
            $props = $props->with('font', $themed ?? Dom::attr($fonts, self::W, 'ascii') ?? Dom::attr($fonts, self::W, 'hAnsi'));
        }

        $size = Dom::attr(Dom::child($rPr, 'sz'), self::W, 'val');

        if ($size !== null && is_numeric($size)) {
            $props = $props->with('size_pt', (float) $size / 2);
        }

        foreach (['b' => 'bold', 'i' => 'italic', 'smallCaps' => 'small_caps'] as $tag => $key) {
            $element = Dom::child($rPr, $tag);

            if ($element !== null) {
                $props = $props->with($key, $this->onOff($element));
            }
        }

        $underline = Dom::attr(Dom::child($rPr, 'u'), self::W, 'val');

        if ($underline !== null) {
            $props = $props->with('underline', strtolower($underline) !== 'none');
        }

        $vertical = Dom::attr(Dom::child($rPr, 'vertAlign'), self::W, 'val');

        if ($vertical !== null) {
            $props = $props->with('superscript', $vertical === 'superscript')->with('subscript', $vertical === 'subscript');
        }

        $color = Dom::attr(Dom::child($rPr, 'color'), self::W, 'val');

        if ($color !== null) {
            $props = $props->with('color', strtolower($color) === 'auto' ? '000000' : Colors::parse($color));
        }

        return $props;
    }

    private function paragraphProps(DOMElement $pPr): Props
    {
        $props = new Props;

        $alignment = Dom::attr(Dom::child($pPr, 'jc'), self::W, 'val');

        if ($alignment !== null) {
            $props = $props->with('alignment', match ($alignment) {
                'center' => 'center',
                'right', 'end' => 'right',
                'both', 'distribute', 'mediumKashida', 'highKashida', 'lowKashida', 'thaiDistribute' => 'justify',
                default => 'left',
            });
        }

        $spacing = Dom::child($pPr, 'spacing');

        if ($spacing !== null) {
            $before = Dom::attr($spacing, self::W, 'before');
            $after = Dom::attr($spacing, self::W, 'after');
            $line = Dom::attr($spacing, self::W, 'line');
            $props = $props
                ->with('space_before_pt', $before === null ? null : Units::twipsToPoints((float) $before))
                ->with('space_after_pt', $after === null ? null : Units::twipsToPoints((float) $after));

            if ($line !== null && is_numeric($line)) {
                $rule = Dom::attr($spacing, self::W, 'lineRule') ?? 'auto';
                $props = match ($rule) {
                    'exact' => $props->with('line_kind', 'exact')->with('line_value', Units::twipsToPoints((float) $line)),
                    'atLeast' => $props->with('line_kind', 'atleast')->with('line_value', Units::twipsToPoints((float) $line)),
                    default => $props->with('line_kind', 'multiple')->with('line_value', (float) $line / 240),
                };
            }
        }

        $indent = Dom::child($pPr, 'ind');

        if ($indent !== null) {
            $left = Dom::attr($indent, self::W, 'left') ?? Dom::attr($indent, self::W, 'start');
            $first = Dom::attr($indent, self::W, 'firstLine');
            $hanging = Dom::attr($indent, self::W, 'hanging');
            $props = $props->with('indent_left_mm', $left === null ? null : Units::twipsToMillimetres((float) $left));

            if ($hanging !== null) {
                $props = $props->with('indent_first_mm', -Units::twipsToMillimetres((float) $hanging));
            } elseif ($first !== null) {
                $props = $props->with('indent_first_mm', Units::twipsToMillimetres((float) $first));
            }
        }

        $suppress = Dom::child($pPr, 'suppressAutoHyphens');

        if ($suppress !== null) {
            $props = $props->with('suppress_hyphens', $this->onOff($suppress));
        }

        $pageBreak = Dom::child($pPr, 'pageBreakBefore');

        if ($pageBreak !== null) {
            $props = $props->with('page_break_before', $this->onOff($pageBreak));
        }

        $numbering = Dom::child($pPr, 'numPr');

        if ($numbering !== null) {
            $numId = Dom::attr(Dom::child($numbering, 'numId'), self::W, 'val');
            $level = Dom::attr(Dom::child($numbering, 'ilvl'), self::W, 'val');
            $props = $props->with('num_id', $numId)->with('num_level', $level === null ? null : (float) $level);
        }

        $tabs = Dom::child($pPr, 'tabs');

        if ($tabs !== null) {
            $props = $props->withTabs(array_map(fn (DOMElement $tab): TabStop => new TabStop(
                Units::twipsToMillimetres((float) $tab->getAttributeNS(self::W, 'pos')),
                match ($tab->getAttributeNS(self::W, 'val')) {
                    'center' => 'center',
                    'right', 'end' => 'right',
                    'decimal' => 'decimal',
                    'bar' => 'bar',
                    'clear' => 'clear',
                    default => 'left',
                },
                match ($tab->getAttributeNS(self::W, 'leader')) {
                    'dot' => 'dot',
                    'hyphen' => 'hyphen',
                    'underscore', 'heavy' => 'underscore',
                    'middleDot' => 'middledot',
                    default => 'none',
                },
            ), Dom::children($tabs, 'tab')));
        }

        return $props;
    }

    /** Kapcsoló elem (`w:b`): érték nélkül igaz, "0/false/off" hamis. */
    private function onOff(DOMElement $element): bool
    {
        $value = Dom::attr($element, self::W, 'val');

        return $value === null || ! in_array(strtolower($value), ['0', 'false', 'off'], true);
    }

    private function isTrue(string $value): bool
    {
        return in_array(strtolower($value), ['1', 'true', 'on'], true);
    }

    // --- Segédrészek -------------------------------------------------------------

    /** @param  array<string, string>  $namespaces */
    private function loadStyles(array $namespaces): void
    {
        $xml = $this->zips->read($this->zip, 'word/styles.xml');
        $definitions = [];
        $defaults = new Props;
        $defaultId = null;

        if ($xml !== null) {
            $xpath = Dom::xpath(XmlSafety::load($xml), $namespaces);

            $rPrDefault = Dom::first($xpath, '/w:styles/w:docDefaults/w:rPrDefault/w:rPr');
            $pPrDefault = Dom::first($xpath, '/w:styles/w:docDefaults/w:pPrDefault/w:pPr');
            $defaults = ($rPrDefault === null ? new Props : $this->characterProps($rPrDefault))
                ->overlay($pPrDefault === null ? new Props : $this->paragraphProps($pPrDefault));

            foreach (Dom::elements($xpath, '/w:styles/w:style') as $style) {
                $id = Dom::attr($style, self::W, 'styleId');

                if ($id === null) {
                    continue;
                }

                $this->styleElements[$id] = $style;
                $type = Dom::attr($style, self::W, 'type');
                $pPr = Dom::child($style, 'pPr');
                $rPr = Dom::child($style, 'rPr');

                $definitions[] = new StyleDefinition(
                    $id,
                    Dom::attr(Dom::child($style, 'name'), self::W, 'val') ?? $id,
                    match ($type) {
                        'paragraph' => StyleDefinition::PARAGRAPH,
                        'character' => StyleDefinition::CHARACTER,
                        default => StyleDefinition::OTHER,
                    },
                    Dom::attr(Dom::child($style, 'basedOn'), self::W, 'val'),
                    ($rPr === null ? new Props : $this->characterProps($rPr))
                        ->overlay($pPr === null ? new Props : $this->paragraphProps($pPr)),
                );

                if ($type === 'paragraph' && $this->isTrue(Dom::attr($style, self::W, 'default') ?? '')) {
                    $defaultId = $id;
                }
            }
        }

        $this->resolver = new StyleResolver($definitions, $defaults, $defaultId);
    }

    /** @param  array<string, string>  $namespaces */
    private function loadNumbering(array $namespaces): void
    {
        $xml = $this->zips->read($this->zip, 'word/numbering.xml');

        if ($xml === null) {
            return;
        }

        $xpath = Dom::xpath(XmlSafety::load($xml), $namespaces);
        $abstract = [];

        foreach (Dom::elements($xpath, '/w:numbering/w:abstractNum') as $definition) {
            $abstractId = Dom::attr($definition, self::W, 'abstractNumId');

            if ($abstractId === null) {
                continue;
            }

            foreach (Dom::children($definition, 'lvl') as $level) {
                $index = (int) (Dom::attr($level, self::W, 'ilvl') ?? 0);
                $abstract[$abstractId][$index] = [
                    Dom::attr(Dom::child($level, 'numFmt'), self::W, 'val') ?? 'decimal',
                    Dom::attr(Dom::child($level, 'lvlText'), self::W, 'val') ?? '',
                ];
            }
        }

        foreach (Dom::elements($xpath, '/w:numbering/w:num') as $number) {
            $numId = Dom::attr($number, self::W, 'numId');
            $abstractId = Dom::attr(Dom::child($number, 'abstractNumId'), self::W, 'val');

            if ($numId !== null && $abstractId !== null && isset($abstract[$abstractId])) {
                $this->numbering[$numId] = $abstract[$abstractId];
            }
        }
    }

    private function loadSettings(): void
    {
        $xml = $this->zips->read($this->zip, 'word/settings.xml');

        if ($xml === null) {
            return;
        }

        $xpath = Dom::xpath(XmlSafety::load($xml), ['w' => self::W]);
        $setting = Dom::first($xpath, '/w:settings/w:autoHyphenation');

        $this->autoHyphenation = $setting !== null && $this->onOff($setting);
    }

    /** @param  array<string, string>  $namespaces */
    private function loadTheme(array $namespaces): void
    {
        $xml = $this->zips->read($this->zip, 'word/theme/theme1.xml');

        if ($xml === null) {
            return;
        }

        $xpath = Dom::xpath(XmlSafety::load($xml), $namespaces);

        foreach (['major', 'minor'] as $kind) {
            $latin = Dom::first($xpath, "//a:fontScheme/a:{$kind}Font/a:latin");
            $typeface = $latin?->getAttribute('typeface');
            $this->themeFonts[$kind] = $typeface === null || $typeface === '' ? null : $typeface;
        }
    }

    /** @return list<string> */
    private function definedStyleNames(): array
    {
        $names = [];

        foreach ($this->styleElements as $id => $style) {
            $names[] = Dom::attr(Dom::child($style, 'name'), self::W, 'val') ?? $id;
        }

        return $names;
    }
}
