<?php

declare(strict_types=1);

namespace App\Services\FileTasks\Document;

use App\Services\Files\XmlSafety;
use App\Services\Files\ZipSafety;
use App\Services\FileTasks\Grammar\Colors;
use App\Services\FileTasks\UnreadableFile;
use DOMElement;
use DOMNode;
use DOMText;
use DOMXPath;
use ZipArchive;

/**
 * OpenDocument szöveg (odt) értelmezése DocumentModell-lé. Egyszer használatos:
 * példányonként egy fájl. A stílusok a styles.xml-ből és a content.xml
 * automatikus stílusaiból jönnek; az automatikus stílusnál a felhasználónak
 * mutatott név az első nevesített ős neve.
 */
final class OdtParser
{
    private const OFFICE = 'urn:oasis:names:tc:opendocument:xmlns:office:1.0';

    private const STYLE = 'urn:oasis:names:tc:opendocument:xmlns:style:1.0';

    private const TEXT = 'urn:oasis:names:tc:opendocument:xmlns:text:1.0';

    private const TABLE = 'urn:oasis:names:tc:opendocument:xmlns:table:1.0';

    private const FO = 'urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0';

    private const SVG = 'urn:oasis:names:tc:opendocument:xmlns:svg-compatible:1.0';

    private const DRAW = 'urn:oasis:names:tc:opendocument:xmlns:drawing:1.0';

    private const MAX_DEPTH = 24;

    private DOMXPath $content;

    private StyleResolver $resolver;

    /** @var array<string, DOMElement> minden style:style név szerint (a content.xml automatikus stílusai felülírják a styles.xml-ét) */
    private array $styleElements = [];

    /** @var array<string, true> az automatikus stílusok nevei */
    private array $automatic = [];

    /** @var array<string, string> betűcsalád-név => betűtípus */
    private array $fontFaces = [];

    /** @var array<string, array<int, array{string, string}>> listastílus => szint => [típus, jel] */
    private array $listStyles = [];

    /** @var array<string, DOMElement> oldalstílus (style:page-layout) név szerint */
    private array $pageLayouts = [];

    /** @var array<string, string> mesteroldal neve => oldalstílus neve */
    private array $masterPages = [];

    private ?string $currentMaster = null;

    private ?SectionInfo $currentPage = null;

    /** @var list<ParagraphInfo> */
    private array $paragraphs = [];

    /** @var list<SectionInfo> */
    private array $sections = [];

    /** @var list<TableInfo> */
    private array $tables = [];

    /** @var list<ImageInfo> */
    private array $images = [];

    public function __construct(
        private readonly ZipArchive $zip,
        private readonly ZipSafety $zips,
    ) {}

    /** @throws UnreadableFile */
    public function parse(): DocumentModel
    {
        $contentXml = $this->zips->read($this->zip, 'content.xml')
            ?? throw new UnreadableFile('Hiányzik a content.xml.');

        $namespaces = [
            'office' => self::OFFICE, 'style' => self::STYLE, 'text' => self::TEXT, 'table' => self::TABLE,
            'fo' => self::FO, 'svg' => self::SVG, 'draw' => self::DRAW,
        ];

        $this->content = Dom::xpath(XmlSafety::load($contentXml), $namespaces);

        $stylesXml = $this->zips->read($this->zip, 'styles.xml');
        $styles = $stylesXml === null ? null : Dom::xpath(XmlSafety::load($stylesXml), $namespaces);

        $this->collect($styles, $this->content);

        $definitions = [];
        $defaults = new Props;

        if ($styles !== null) {
            $defaultStyle = Dom::first($styles, '//office:styles/style:default-style[@style:family="paragraph"]');
            $defaults = $defaultStyle === null ? new Props : $this->styleProps($defaultStyle);
        }

        foreach ($this->styleElements as $name => $element) {
            $family = $element->getAttributeNS(self::STYLE, 'family');
            $parent = Dom::attr($element, self::STYLE, 'parent-style-name');
            $definitions[] = new StyleDefinition(
                $name,
                $this->displayName($element, $name),
                match ($family) {
                    'paragraph' => StyleDefinition::PARAGRAPH,
                    'text' => StyleDefinition::CHARACTER,
                    default => StyleDefinition::OTHER,
                },
                $parent,
                $this->styleProps($element),
            );
        }

        $defaultId = isset($this->styleElements['Standard']) ? 'Standard' : null;
        $this->resolver = new StyleResolver($definitions, $defaults, $defaultId);

        $firstMaster = array_key_first($this->masterPages);
        $this->currentMaster = $firstMaster;
        $firstSection = $this->pageSection($firstMaster, 'page');
        $this->sections = [$firstSection];
        $this->currentPage = $firstSection;

        $text = Dom::first($this->content, '/office:document-content/office:body/office:text')
            ?? throw new UnreadableFile('Hiányzik a szöveg törzse.');

        $this->walk($text, 0, null, 0);

        return new DocumentModel(
            'odt',
            $this->paragraphs,
            [$firstSection, ...array_slice($this->sections, 1)],
            $this->tables,
            $this->images,
            $this->definedStyleNames(),
            $this->paragraphFor(null, null, null, $this->resolver->paragraph(null), '', []),
            $this->resolver,
        );
    }

    // --- Stílusok begyűjtése -------------------------------------------------

    private function collect(?DOMXPath $styles, DOMXPath $content): void
    {
        foreach (array_filter([$styles, $content]) as $xpath) {
            foreach (Dom::elements($xpath, '//style:font-face') as $face) {
                $name = Dom::attr($face, self::STYLE, 'name');
                $family = Dom::attr($face, self::SVG, 'font-family');

                if ($name !== null && $family !== null) {
                    $this->fontFaces[$name] = trim($family, " '\"");
                }
            }

            foreach (Dom::elements($xpath, '//style:style') as $style) {
                $name = Dom::attr($style, self::STYLE, 'name');

                if ($name === null) {
                    continue;
                }

                $this->styleElements[$name] = $style;
                unset($this->automatic[$name]);

                if ($style->parentNode?->localName === 'automatic-styles') {
                    $this->automatic[$name] = true;
                }
            }

            foreach (Dom::elements($xpath, '//text:list-style') as $listStyle) {
                $name = Dom::attr($listStyle, self::STYLE, 'name');

                if ($name === null) {
                    continue;
                }

                foreach (Dom::children($listStyle) as $level) {
                    $index = (int) (Dom::attr($level, self::TEXT, 'level') ?? 1);

                    if ($level->localName === 'list-level-style-bullet') {
                        $this->listStyles[$name][$index] = ['bullet', Dom::attr($level, self::TEXT, 'bullet-char') ?? ''];
                    } elseif ($level->localName === 'list-level-style-number') {
                        $this->listStyles[$name][$index] = ['number', (Dom::attr($level, self::STYLE, 'num-prefix') ?? '')
                            .'%'.$index.(Dom::attr($level, self::STYLE, 'num-suffix') ?? '')];
                    }
                }
            }

            foreach (Dom::elements($xpath, '//style:page-layout') as $layout) {
                $name = Dom::attr($layout, self::STYLE, 'name');

                if ($name !== null) {
                    $this->pageLayouts[$name] = $layout;
                }
            }
        }

        if ($styles !== null) {
            foreach (Dom::elements($styles, '//office:master-styles/style:master-page') as $master) {
                $name = Dom::attr($master, self::STYLE, 'name');

                if ($name !== null) {
                    $this->masterPages[$name] = Dom::attr($master, self::STYLE, 'page-layout-name') ?? '';
                }
            }
        }
    }

    private function displayName(DOMElement $style, string $name): string
    {
        return Dom::attr($style, self::STYLE, 'display-name') ?? str_replace('_20_', ' ', $name);
    }

    /** Az első nevesített (nem automatikus) stílus a láncban: ezt látja a felhasználó. */
    private function namedAncestor(?string $name): ?string
    {
        for ($depth = 0; $name !== null && isset($this->automatic[$name]) && $depth < self::MAX_DEPTH; $depth++) {
            $name = Dom::attr($this->styleElements[$name] ?? null, self::STYLE, 'parent-style-name');
        }

        return $name;
    }

    // --- Tartalom ---------------------------------------------------------------

    private function walk(DOMElement $parent, int $depth, ?string $listStyle, int $listLevel): void
    {
        if ($depth > self::MAX_DEPTH) {
            throw new UnreadableFile('A dokumentum szerkezete túl mélyen ágyazott.');
        }

        foreach (Dom::children($parent) as $child) {
            switch ($child->localName) {
                case 'p':
                case 'h':
                    $this->paragraph($child, $listStyle, $listLevel);
                    break;
                case 'section':
                    $this->sections[] = $this->textSection($child);
                    $this->walk($child, $depth + 1, $listStyle, $listLevel);
                    break;
                case 'table':
                    if ($child->namespaceURI === self::TABLE) {
                        $this->table($child, $depth, false);
                    }
                    break;
                case 'list':
                    $this->listing($child, $depth, $listStyle, $listLevel);
                    break;
                case 'frame':
                    $this->image($child);
                    break;
                default:
                    break;
            }
        }
    }

    private function listing(DOMElement $list, int $depth, ?string $inheritedStyle, int $level): void
    {
        $style = Dom::attr($list, self::TEXT, 'style-name') ?? $inheritedStyle;

        foreach (Dom::children($list) as $item) {
            if ($item->localName === 'list-item' || $item->localName === 'list-header') {
                $this->walk($item, $depth + 1, $style, $level + 1);
            }
        }
    }

    private function paragraph(DOMElement $paragraph, ?string $listStyle, int $listLevel): void
    {
        $styleName = Dom::attr($paragraph, self::TEXT, 'style-name');
        $base = $this->resolver->paragraph($styleName);
        $hyphenate = $base->bool('hyphenation');
        $base = $base->with('hyphenation', $hyphenate ?? false);

        $this->enterMasterPage($styleName);

        $runs = [];
        $text = '';
        $this->inline($paragraph, $base, $runs, $text, 0);

        foreach (Dom::elements($this->content, './/draw:frame', $paragraph) as $frame) {
            $this->image($frame);
        }

        $list = null;

        if ($listStyle !== null && $listLevel > 0) {
            [$type, $symbol] = $this->listStyles[$listStyle][$listLevel] ?? [null, null];
            $list = $type === null ? null : new ListInfo($type, $listLevel, (string) $symbol);
        }

        $outline = Dom::attr($paragraph, self::TEXT, 'outline-level');
        $heading = $paragraph->localName === 'h'
            ? (int) ($outline ?? $this->resolver->headingLevel($styleName) ?? 1)
            : $this->resolver->headingLevel($styleName);

        $this->paragraphs[] = $this->paragraphFor($styleName, $heading, $list, $base, $text, $runs);
    }

    /**
     * @param  list<RunInfo>  $runs
     */
    private function paragraphFor(?string $styleName, ?int $heading, ?ListInfo $list, Props $base, string $text, array $runs): ParagraphInfo
    {
        $named = $this->namedAncestor($styleName ?? $this->resolver->defaultParagraphStyleId());
        $style = $named === null ? null : ($this->styleElements[$named] ?? null);

        return new ParagraphInfo(
            $text,
            $named,
            $style === null ? ($named ?? '') : $this->displayName($style, (string) $named),
            $heading,
            $base,
            $runs === [] ? [new RunInfo('', $base)] : $runs,
            $list,
        );
    }

    /**
     * @param  list<RunInfo>  $runs
     */
    private function inline(DOMNode $parent, Props $current, array &$runs, string &$text, int $depth): void
    {
        if ($depth > self::MAX_DEPTH) {
            throw new UnreadableFile('A bekezdés túl mélyen ágyazott.');
        }

        foreach ($parent->childNodes as $node) {
            if ($node instanceof DOMText) {
                $piece = $node->data;
                $text .= $piece;

                if (trim($piece) !== '') {
                    $runs[] = new RunInfo($piece, $current);
                }

                continue;
            }

            if (! $node instanceof DOMElement) {
                continue;
            }

            switch ($node->localName) {
                case 'span':
                    $spanStyle = Dom::attr($node, self::TEXT, 'style-name');
                    $this->inline($node, $this->resolver->withCharacterStyle($current, $spanStyle), $runs, $text, $depth + 1);
                    break;
                case 's':
                    $text .= str_repeat(' ', max(1, (int) (Dom::attr($node, self::TEXT, 'c') ?? 1)));
                    break;
                case 'tab':
                    $text .= "\t";
                    break;
                case 'line-break':
                    $text .= "\n";
                    break;
                case 'note':
                case 'annotation':
                case 'frame':
                    break;
                default:
                    $this->inline($node, $current, $runs, $text, $depth + 1);
            }
        }
    }

    // --- Képek ----------------------------------------------------------------------

    private function image(DOMElement $frame): void
    {
        if (Dom::first($this->content, './draw:image', $frame) === null) {
            return;
        }

        $width = Units::odfLengthToMillimetres(Dom::attr($frame, self::SVG, 'width'));
        $height = Units::odfLengthToMillimetres(Dom::attr($frame, self::SVG, 'height'));

        if ($width === null || $height === null) {
            return;
        }

        $alt = Dom::first($this->content, './svg:desc', $frame)->textContent ?? '';

        if ($alt === '') {
            $alt = Dom::first($this->content, './svg:title', $frame)->textContent ?? '';
        }

        $this->images[] = new ImageInfo($width, $height, $this->wrapOf($frame), $alt);
    }

    private function wrapOf(DOMElement $frame): string
    {
        if (Dom::attr($frame, self::TEXT, 'anchor-type') === 'as-char') {
            return 'inline';
        }

        $name = Dom::attr($frame, self::DRAW, 'style-name');

        for ($depth = 0; $name !== null && $depth < self::MAX_DEPTH; $depth++) {
            $style = $this->styleElements[$name] ?? null;
            $properties = $style === null ? null : Dom::child($style, 'graphic-properties');
            $wrap = Dom::attr($properties, self::STYLE, 'wrap');

            if ($wrap !== null) {
                return match ($wrap) {
                    'none' => 'topbottom',
                    'run-through' => Dom::attr($properties, self::STYLE, 'run-through') === 'background' ? 'behind' : 'front',
                    default => 'square',
                };
            }

            $name = $style === null ? null : Dom::attr($style, self::STYLE, 'parent-style-name');
        }

        return 'square';
    }

    // --- Táblázatok ----------------------------------------------------------------

    private function table(DOMElement $table, int $depth, bool $nested): void
    {
        if (! $nested) {
            $this->tables[] = $this->tableInfo($table);
        }

        foreach (Dom::elements($this->content, './/table:table-cell | .//table:covered-table-cell', $table) as $cell) {
            if ($this->nearestTable($cell) === $table) {
                $this->walk($cell, $depth + 1, null, 0);
            }
        }
    }

    private function nearestTable(DOMElement $node): ?DOMNode
    {
        $parent = $node->parentNode;

        while ($parent !== null && ! ($parent instanceof DOMElement && $parent->localName === 'table' && $parent->namespaceURI === self::TABLE)) {
            $parent = $parent->parentNode;
        }

        return $parent;
    }

    private function tableInfo(DOMElement $table): TableInfo
    {
        $columns = 0;

        foreach (Dom::elements($this->content, './table:table-column | ./table:table-columns/table:table-column | ./table:table-header-columns/table:table-column', $table) as $column) {
            $columns += max(1, (int) (Dom::attr($column, self::TABLE, 'number-columns-repeated') ?? 1));
        }

        $rows = 0;
        $height = null;
        $fills = [];
        $borders = false;

        foreach (Dom::elements($this->content, './table:table-row | ./table:table-rows/table:table-row | ./table:table-header-rows/table:table-row', $table) as $row) {
            $repeat = max(1, (int) (Dom::attr($row, self::TABLE, 'number-rows-repeated') ?? 1));
            $rows += $repeat;

            $rowHeight = $this->styleProperty(Dom::attr($row, self::TABLE, 'style-name'), 'table-row-properties', self::STYLE, 'row-height')
                ?? $this->styleProperty(Dom::attr($row, self::TABLE, 'style-name'), 'table-row-properties', self::STYLE, 'min-row-height');
            $millimetres = Units::odfLengthToMillimetres($rowHeight);

            if ($millimetres !== null) {
                $height = ($height ?? 0.0) + $millimetres * $repeat;
            }

            foreach (Dom::children($row, 'table-cell') as $cell) {
                $cellStyle = Dom::attr($cell, self::TABLE, 'style-name');
                $background = $this->styleProperty($cellStyle, 'table-cell-properties', self::FO, 'background-color');
                $color = $background === null ? null : Colors::parse($background);

                if ($color !== null && ! in_array($color, $fills, true)) {
                    $fills[] = $color;
                }

                $borders = $borders || $this->hasBorder($cellStyle, 'table-cell-properties');
            }
        }

        $style = Dom::attr($table, self::TABLE, 'style-name');
        $borders = $borders || $this->hasBorder($style, 'table-properties');

        $align = $this->styleProperty($style, 'table-properties', self::TABLE, 'align');

        return new TableInfo(
            $rows,
            $columns,
            $borders,
            Units::odfLengthToMillimetres($this->styleProperty($style, 'table-properties', self::STYLE, 'width')),
            $height,
            $fills,
            match ($align) {
                'center' => 'center',
                'right' => 'right',
                default => 'left',
            },
        );
    }

    private function hasBorder(?string $styleName, string $propertiesTag): bool
    {
        $style = $styleName === null ? null : ($this->styleElements[$styleName] ?? null);
        $properties = $style === null ? null : Dom::child($style, $propertiesTag);

        if ($properties === null) {
            return false;
        }

        foreach (['border', 'border-top', 'border-bottom', 'border-left', 'border-right'] as $name) {
            $value = trim(Dom::attr($properties, self::FO, $name) ?? '');

            if ($value === '' || in_array(strtolower($value), ['none', 'hidden'], true)) {
                continue;
            }

            // "0.5pt solid #000000": a szélesség nulla, ha nincs vonal.
            if (preg_match('/^(\d*\.?\d+)/', $value, $width) === 1 && (float) $width[1] <= 0.0) {
                continue;
            }

            return true;
        }

        return false;
    }

    private function styleProperty(?string $styleName, string $propertiesTag, string $namespace, string $attribute): ?string
    {
        for ($depth = 0; $styleName !== null && $depth < self::MAX_DEPTH; $depth++) {
            $style = $this->styleElements[$styleName] ?? null;

            if ($style === null) {
                return null;
            }

            $value = Dom::attr(Dom::child($style, $propertiesTag), $namespace, $attribute);

            if ($value !== null) {
                return $value;
            }

            $styleName = Dom::attr($style, self::STYLE, 'parent-style-name');
        }

        return null;
    }

    // --- Szakaszok ---------------------------------------------------------------------

    private function enterMasterPage(?string $paragraphStyle): void
    {
        $master = $this->styleAttribute($paragraphStyle, 'master-page-name');

        if ($master !== null && $master !== '' && $master !== $this->currentMaster && isset($this->masterPages[$master])) {
            $this->currentMaster = $master;
            $this->currentPage = $this->pageSection($master, 'page');
            $this->sections[] = $this->currentPage;
        }
    }

    private function styleAttribute(?string $styleName, string $attribute): ?string
    {
        for ($depth = 0; $styleName !== null && $depth < self::MAX_DEPTH; $depth++) {
            $style = $this->styleElements[$styleName] ?? null;

            if ($style === null) {
                return null;
            }

            $value = Dom::attr($style, self::STYLE, $attribute);

            if ($value !== null) {
                return $value;
            }

            $styleName = Dom::attr($style, self::STYLE, 'parent-style-name');
        }

        return null;
    }

    private function pageSection(?string $master, string $breakType): SectionInfo
    {
        $layoutName = $master === null ? null : ($this->masterPages[$master] ?? null);
        $layout = $layoutName === null ? null : ($this->pageLayouts[$layoutName] ?? null);
        $properties = $layout === null ? null : Dom::child($layout, 'page-layout-properties');

        if ($properties === null) {
            return new SectionInfo(null, null, null, null, null, null, 1, $breakType);
        }

        $all = Units::odfLengthToMillimetres(Dom::attr($properties, self::FO, 'margin'));
        $margin = fn (string $side): ?float => Units::odfLengthToMillimetres(Dom::attr($properties, self::FO, 'margin-'.$side)) ?? $all;
        $columns = (int) (Dom::attr(Dom::child($properties, 'columns'), self::FO, 'column-count') ?? 1);

        return new SectionInfo(
            Units::odfLengthToMillimetres(Dom::attr($properties, self::FO, 'page-width')),
            Units::odfLengthToMillimetres(Dom::attr($properties, self::FO, 'page-height')),
            $margin('top'),
            $margin('bottom'),
            $margin('left'),
            $margin('right'),
            max(1, $columns),
            $breakType,
        );
    }

    private function textSection(DOMElement $section): SectionInfo
    {
        $page = $this->currentPage ?? $this->sections[0];
        $name = Dom::attr($section, self::TEXT, 'style-name');
        $style = $name === null ? null : ($this->styleElements[$name] ?? null);
        $columns = (int) (Dom::attr(Dom::child(Dom::child($style, 'section-properties'), 'columns'), self::FO, 'column-count') ?? 1);

        return new SectionInfo(
            $page->widthMm,
            $page->heightMm,
            $page->marginTopMm,
            $page->marginBottomMm,
            $page->marginLeftMm,
            $page->marginRightMm,
            max(1, $columns),
            'continuous',
        );
    }

    // --- Formázás ---------------------------------------------------------------------------

    private function styleProps(DOMElement $style): Props
    {
        $props = new Props;
        $text = Dom::child($style, 'text-properties');

        if ($text !== null) {
            $props = $this->textProps($text);
        }

        $paragraph = Dom::child($style, 'paragraph-properties');

        return $paragraph === null ? $props : $props->overlay($this->paragraphProps($paragraph));
    }

    private function textProps(DOMElement $text): Props
    {
        $font = Dom::attr($text, self::FO, 'font-family');
        $faceName = Dom::attr($text, self::STYLE, 'font-name');
        $font = $font !== null ? trim($font, " '\"") : ($faceName === null ? null : ($this->fontFaces[$faceName] ?? $faceName));

        $size = Dom::attr($text, self::FO, 'font-size');
        $weight = Dom::attr($text, self::FO, 'font-weight');
        $fontStyle = Dom::attr($text, self::FO, 'font-style');
        $underline = Dom::attr($text, self::STYLE, 'text-underline-style');
        $variant = Dom::attr($text, self::FO, 'font-variant');
        $position = Dom::attr($text, self::STYLE, 'text-position');
        $color = Dom::attr($text, self::FO, 'color');

        $props = (new Props)
            ->with('font', $font)
            ->with('size_pt', Units::odfLengthToPoints($size))
            ->with('bold', $weight === null ? null : ($weight === 'bold' || (is_numeric($weight) && (int) $weight >= 600)))
            ->with('italic', $fontStyle === null ? null : in_array($fontStyle, ['italic', 'oblique'], true))
            ->with('underline', $underline === null ? null : $underline !== 'none')
            ->with('small_caps', $variant === null ? null : $variant === 'small-caps')
            ->with('color', $color === null ? null : Colors::parse($color));

        if ($position !== null) {
            $first = strtolower(strtok($position, ' ') ?: '');
            $percent = is_numeric(rtrim($first, '%')) ? (float) rtrim($first, '%') : 0.0;
            $props = $props
                ->with('superscript', $first === 'super' || $percent > 0)
                ->with('subscript', $first === 'sub' || $percent < 0);
        }

        return $props;
    }

    private function paragraphProps(DOMElement $paragraph): Props
    {
        $props = new Props;

        $align = Dom::attr($paragraph, self::FO, 'text-align');

        if ($align !== null) {
            $props = $props->with('alignment', match ($align) {
                'center' => 'center',
                'end', 'right' => 'right',
                'justify' => 'justify',
                default => 'left',
            });
        }

        $all = Units::odfLengthToPoints(Dom::attr($paragraph, self::FO, 'margin'));
        $props = $props
            ->with('space_before_pt', Units::odfLengthToPoints(Dom::attr($paragraph, self::FO, 'margin-top')) ?? $all)
            ->with('space_after_pt', Units::odfLengthToPoints(Dom::attr($paragraph, self::FO, 'margin-bottom')) ?? $all)
            ->with('indent_left_mm', Units::odfLengthToMillimetres(Dom::attr($paragraph, self::FO, 'margin-left'))
                ?? Units::odfLengthToMillimetres(Dom::attr($paragraph, self::FO, 'margin')))
            ->with('indent_first_mm', Units::odfLengthToMillimetres(Dom::attr($paragraph, self::FO, 'text-indent')));

        $lineHeight = Dom::attr($paragraph, self::FO, 'line-height');
        $atLeast = Dom::attr($paragraph, self::STYLE, 'line-height-at-least');

        if ($lineHeight !== null && str_ends_with(trim($lineHeight), '%')) {
            $props = $props->with('line_kind', 'multiple')->with('line_value', (float) rtrim(trim($lineHeight), '%') / 100);
        } elseif ($lineHeight !== null && Units::odfLengthToPoints($lineHeight) !== null && Units::odfLengthToPoints($lineHeight) > 0) {
            $props = $props->with('line_kind', 'exact')->with('line_value', Units::odfLengthToPoints($lineHeight));
        } elseif ($atLeast !== null && Units::odfLengthToPoints($atLeast) !== null) {
            $props = $props->with('line_kind', 'atleast')->with('line_value', Units::odfLengthToPoints($atLeast));
        }

        $hyphenate = Dom::attr($paragraph, self::FO, 'hyphenate');
        $breakBefore = Dom::attr($paragraph, self::FO, 'break-before');

        $props = $props
            ->with('hyphenation', $hyphenate === null ? null : $hyphenate === 'true')
            ->with('page_break_before', $breakBefore === null ? null : $breakBefore === 'page');

        $tabs = Dom::child($paragraph, 'tab-stops');

        if ($tabs !== null) {
            $props = $props->withTabs(array_map(fn (DOMElement $tab): TabStop => new TabStop(
                Units::odfLengthToMillimetres(Dom::attr($tab, self::STYLE, 'position')) ?? 0.0,
                match (Dom::attr($tab, self::STYLE, 'type')) {
                    'center' => 'center',
                    'right' => 'right',
                    'char' => 'decimal',
                    default => 'left',
                },
                $this->leaderOf($tab),
            ), Dom::children($tabs, 'tab-stop')));
        }

        return $props;
    }

    private function leaderOf(DOMElement $tab): string
    {
        $style = Dom::attr($tab, self::STYLE, 'leader-style') ?? 'none';

        if ($style === 'none') {
            return 'none';
        }

        return match (Dom::attr($tab, self::STYLE, 'leader-text')) {
            '.' => 'dot',
            '-' => 'hyphen',
            '_' => 'underscore',
            default => match ($style) {
                'dotted' => 'dot',
                'dash', 'long-dash' => 'hyphen',
                'solid' => 'underscore',
                default => 'dot',
            },
        };
    }

    /** @return list<string> */
    private function definedStyleNames(): array
    {
        $names = [];

        foreach ($this->styleElements as $name => $style) {
            if (! isset($this->automatic[$name])) {
                $names[] = $this->displayName($style, $name);
            }
        }

        return $names;
    }
}
