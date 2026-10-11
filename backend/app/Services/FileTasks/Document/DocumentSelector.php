<?php

declare(strict_types=1);

namespace App\Services\FileTasks\Document;

use App\Services\FileTasks\Grammar\Text;

/**
 * A `property` szögletes zárójeles szelektora a dokumentumcsaládban:
 * `[paragraph=N]`, `[style=NÉV]`, `[text=RÉSZLET]`, `[heading=N]`,
 * `[table=N]`, `[image=N]`, `[section=N]` (BACKEND.md 4.4.3).
 */
final readonly class DocumentSelector
{
    /** A sorszámot váró szelektorok (1-től). */
    private const NUMBERED = ['paragraph', 'heading', 'table', 'image', 'section'];

    private function __construct(
        public string $kind,
        /** A sorszám (1-től), számszerű szelektornál; különben 0. */
        public int $index,
        /** A név vagy szövegrészlet, szöveges szelektornál; különben üres. */
        public string $value,
    ) {}

    /**
     * @param  list<string>  $allowed  a megengedett szelektorfajták
     * @return self|null null, ha a szelektor nem érvényes vagy nem megengedett
     */
    public static function parse(string $raw, array $allowed): ?self
    {
        $parts = explode('=', $raw, 2);

        if (count($parts) !== 2) {
            return null;
        }

        $kind = strtolower(trim($parts[0]));
        $value = trim($parts[1]);

        if (! in_array($kind, $allowed, true) || $value === '') {
            return null;
        }

        if (in_array($kind, self::NUMBERED, true)) {
            return preg_match('/^[1-9]\d{0,5}$/', $value) === 1 ? new self($kind, (int) $value, '') : null;
        }

        return new self($kind, 0, $value);
    }

    /**
     * A bekezdés-szelektor által kijelölt bekezdések (a `style` mindet, a
     * többi legfeljebb egyet); üres, ha nincs ilyen.
     *
     * @return list<ParagraphInfo>
     */
    public function paragraphs(DocumentModel $document): array
    {
        switch ($this->kind) {
            case 'paragraph':
                $paragraph = $document->paragraphs[$this->index - 1] ?? null;

                return $paragraph === null ? [] : [$paragraph];
            case 'heading':
                $heading = $document->headings()[$this->index - 1] ?? null;

                return $heading === null ? [] : [$heading];
            case 'style':
                return array_values(array_filter(
                    $document->paragraphs,
                    fn (ParagraphInfo $paragraph): bool => $this->usesStyle($paragraph, $this->value),
                ));
            case 'text':
                foreach ($document->paragraphs as $paragraph) {
                    if (Text::contains($paragraph->text, $this->value)) {
                        return [$paragraph];
                    }
                }

                return [];
            default:
                return [];
        }
    }

    /** A bekezdés ezt a stílust használja-e (név vagy azonosító szerint, magyar/angol nevek egyesítve). */
    public function usesStyle(ParagraphInfo $paragraph, string $style): bool
    {
        $wanted = StyleResolver::nameKey($style);

        return StyleResolver::nameKey($paragraph->styleName) === $wanted
            || ($paragraph->styleId !== null && StyleResolver::nameKey($paragraph->styleId) === $wanted);
    }
}
