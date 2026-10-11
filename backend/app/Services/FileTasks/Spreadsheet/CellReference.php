<?php

declare(strict_types=1);

namespace App\Services\FileTasks\Spreadsheet;

/**
 * Az ertekelolap tablazatos cimzese (BACKEND.md 4.4.3): `Munka1!B3`,
 * `Munka1!A1:C9`, `'Eves adatok'!A1`, vagy munkalap nelkul (`B3`), ami az
 * elso munkalapot jelenti.
 */
final readonly class CellReference
{
    private function __construct(
        /** A munkalap neve, ahogy a szerzo beirta; null = az elso munkalap. */
        public ?string $sheet,
        public CellRange $range,
    ) {}

    /** Null, ha a szoveg nem ervenyes cim. */
    public static function parse(string $text): ?self
    {
        $text = trim($text);
        $separator = strrpos($text, '!');
        $sheet = null;

        if ($separator !== false) {
            $sheet = self::unquote(substr($text, 0, $separator));
            $text = substr($text, $separator + 1);

            if ($sheet === '') {
                return null;
            }
        }

        $range = CellRange::parse($text);

        return $range === null ? null : new self($sheet, $range);
    }

    /** A munkalapnev a korulotte allo aposztrofok nelkul ('Eves adatok' => Eves adatok). */
    public static function unquote(string $sheet): string
    {
        $sheet = trim($sheet);

        if (strlen($sheet) >= 2 && str_starts_with($sheet, "'") && str_ends_with($sheet, "'")) {
            $sheet = str_replace("''", "'", substr($sheet, 1, -1));
        }

        return trim($sheet);
    }
}
