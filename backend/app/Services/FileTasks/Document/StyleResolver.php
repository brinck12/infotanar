<?php

declare(strict_types=1);

namespace App\Services\FileTasks\Document;

use App\Services\FileTasks\Grammar\Text;

/**
 * A formazas tenyleges erteke: futas -> bekezdesstilus -> "alapja" lanc ->
 * dokumentum-alapertelmezes (docx), illetve ODF-ben a stilus szulo-lanca es az
 * alapertelmezett stilus. A kozvetlen formazast a parser rakja a vegere.
 */
final class StyleResolver
{
    private const MAX_DEPTH = 32;

    /** @var array<string, StyleDefinition> */
    private array $styles = [];

    /**
     * @param  list<StyleDefinition>  $styles
     * @param  Props  $defaults  a dokumentum alapertelmezett karakter- es bekezdesformazasa
     * @param  string|null  $defaultParagraphStyleId  a Normal (docx: w:default="1"; odt: Standard) stilus azonosítója
     */
    public function __construct(
        array $styles,
        private readonly Props $defaults,
        private readonly ?string $defaultParagraphStyleId,
    ) {
        foreach ($styles as $style) {
            $this->styles[$style->id] = $style;
        }
    }

    public function defaultParagraphStyleId(): ?string
    {
        return $this->defaultParagraphStyleId;
    }

    /** Egy bekezdesstilus (vagy a Normal, ha null) teljes, oroklessel feloldott formazasa. */
    public function paragraph(?string $styleId): Props
    {
        return $this->defaults->overlay($this->chain($styleId ?? $this->defaultParagraphStyleId));
    }

    /** Karakterstilus rarakasa egy bekezdes formazasara. */
    public function withCharacterStyle(Props $paragraph, ?string $characterStyleId): Props
    {
        return $characterStyleId === null ? $paragraph : $paragraph->overlay($this->chain($characterStyleId));
    }

    /**
     * Cimsor-szint (1-tol), ha a stilus vagy valamelyik os-stilusa "Heading N" / "Címsor N".
     */
    public function headingLevel(?string $styleId): ?int
    {
        $seen = [];

        for ($id = $styleId; $id !== null && ! isset($seen[$id]) && count($seen) < self::MAX_DEPTH;) {
            $seen[$id] = true;
            $style = $this->styles[$id] ?? null;

            if ($style === null) {
                return null;
            }

            if (preg_match('/^heading(\d)$/', self::nameKey($style->name), $match) === 1) {
                return (int) $match[1];
            }

            $id = $style->basedOn;
        }

        return null;
    }

    public function find(string $id): ?StyleDefinition
    {
        return $this->styles[$id] ?? null;
    }

    /**
     * Stilus keresese a szerzo ugy megirt nevevel, ahogy a Wordben latja:
     * kis/nagybetu, ekezet es szokoz nem szamit, a "Címsor 1" = "Heading 1".
     */
    public function findByName(string $name): ?StyleDefinition
    {
        $wanted = self::nameKey($name);

        foreach ($this->styles as $style) {
            if (self::nameKey($style->name) === $wanted || self::nameKey($style->id) === $wanted) {
                return $style;
            }
        }

        return null;
    }

    /** Osszehasonlithato stilusnev: magyar es angol alapnevek egyesitve ("Címsor 1" = "heading1"). */
    public static function nameKey(string $name): string
    {
        $key = str_replace([' ', '_20_', '_', '-'], '', Text::fold($name));

        return (string) preg_replace(
            ['/^cimsor(?=\d)/', '/^standard$/', '/^alcim$/', '/^cim$/', '/^listaparagrafus$/'],
            ['heading', 'normal', 'subtitle', 'title', 'listparagraph'],
            $key,
        );
    }

    private function chain(?string $styleId): Props
    {
        $lineage = [];
        $seen = [];

        for ($id = $styleId; $id !== null && ! isset($seen[$id]) && count($lineage) < self::MAX_DEPTH;) {
            $seen[$id] = true;
            $style = $this->styles[$id] ?? null;

            if ($style === null) {
                break;
            }

            $lineage[] = $style;
            $id = $style->basedOn;
        }

        $props = new Props;

        foreach (array_reverse($lineage) as $style) {
            $props = $props->overlay($style->props);
        }

        return $props;
    }
}
