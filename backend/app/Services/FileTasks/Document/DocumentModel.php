<?php

declare(strict_types=1);

namespace App\Services\FileTasks\Document;

use App\Services\FileTasks\Fact;
use App\Services\FileTasks\Grammar\Lengths;
use App\Services\FileTasks\Grammar\Numbers;
use App\Services\FileTasks\OpenedFile;

/**
 * Egy megnyitott szövegszerkesztői dokumentum (docx vagy odt) egységes
 * modellje: a parser már feloldotta a stílusokat, a vizsgálatok csak olvassák.
 */
final readonly class DocumentModel implements OpenedFile
{
    /**
     * @param  string  $format  docx | odt
     * @param  list<ParagraphInfo>  $paragraphs  dokumentum-sorrendben, a táblázatcellák bekezdéseivel együtt
     * @param  non-empty-list<SectionInfo>  $sections
     * @param  list<TableInfo>  $tables
     * @param  list<ImageInfo>  $images
     * @param  list<string>  $definedStyleNames  a stíluslapon lévő stílusok nevei
     * @param  ParagraphInfo  $defaults  a Normál stílus formázásával ("dokumentum alapértelmezése")
     */
    public function __construct(
        public string $format,
        public array $paragraphs,
        public array $sections,
        public array $tables,
        public array $images,
        public array $definedStyleNames,
        public ParagraphInfo $defaults,
        public StyleResolver $styles,
    ) {}

    public function firstSection(): SectionInfo
    {
        return $this->sections[0];
    }

    /**
     * A címsorok dokumentum-sorrendben.
     *
     * @return list<ParagraphInfo>
     */
    public function headings(): array
    {
        return array_values(array_filter(
            $this->paragraphs,
            static fn (ParagraphInfo $paragraph): bool => $paragraph->headingLevel !== null,
        ));
    }

    /** @return list<Fact> */
    public function facts(): array
    {
        $facts = [];
        $section = $this->firstSection();

        if ($section->widthMm !== null && $section->heightMm !== null) {
            $facts[] = new Fact(__('filetasks_document.fact_page'), self::sizeLabel($section));
        }

        if ($section->marginTopMm !== null && $section->marginBottomMm !== null
            && $section->marginLeftMm !== null && $section->marginRightMm !== null) {
            $facts[] = new Fact(__('filetasks_document.fact_margins'), __('filetasks_document.margins_value', [
                'top' => Lengths::format($section->marginTopMm),
                'bottom' => Lengths::format($section->marginBottomMm),
                'left' => Lengths::format($section->marginLeftMm),
                'right' => Lengths::format($section->marginRightMm),
            ]));
        }

        $base = $this->defaults->runs[0]->props;
        $font = $base->string('font');
        $size = $base->float('size_pt');

        if ($font !== null) {
            $facts[] = new Fact(__('filetasks_document.fact_font'), $size === null ? $font : $font.', '.Numbers::format($size).' pt');
        }

        $facts[] = new Fact(__('filetasks_document.fact_columns'), (string) $section->columns);
        $facts[] = new Fact(__('filetasks_document.fact_tables'), (string) count($this->tables));
        $facts[] = new Fact(__('filetasks_document.fact_images'), $this->images === []
            ? '0'
            : count($this->images).' ('.implode(', ', array_map(
                static fn (ImageInfo $image): string => Lengths::format($image->widthMm),
                array_slice($this->images, 0, 5),
            )).')');

        $used = $this->usedStyleNames();

        if ($used !== []) {
            $facts[] = new Fact(__('filetasks_document.fact_styles'), implode(', ', array_slice($used, 0, 8)));
        }

        return $facts;
    }

    /**
     * A bekezdésekben használt stílusok nevei, első előfordulás szerint.
     *
     * @return list<string>
     */
    public function usedStyleNames(): array
    {
        $names = [];

        foreach ($this->paragraphs as $paragraph) {
            if ($paragraph->styleName !== '' && ! in_array($paragraph->styleName, $names, true)) {
                $names[] = $paragraph->styleName;
            }
        }

        return $names;
    }

    /** Lapméret neve (A4, Letter...) és tájolás, pl. "A4, álló". */
    public static function sizeLabel(SectionInfo $section): string
    {
        $width = $section->widthMm ?? 0.0;
        $height = $section->heightMm ?? 0.0;
        $orientation = $section->isLandscape() === true ? __('filetasks_document.landscape') : __('filetasks_document.portrait');

        return (PageSizes::nameOf($width, $height) ?? Lengths::format($width).' × '.Lengths::format($height)).', '.$orientation;
    }
}
