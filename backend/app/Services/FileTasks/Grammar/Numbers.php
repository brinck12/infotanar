<?php

declare(strict_types=1);

namespace App\Services\FileTasks\Grammar;

/**
 * Szamok az ertekelolap nyelvtanaban: tizedesvesszo es tizedespont egyarant
 * elfogadott ("0,5" = "0.5"), az ezrestagolo szokoz megengedett, a szazalekjel
 * szazadreszt jelent ("12%" = 0,12).
 */
final class Numbers
{
    /** Ket szam egyezik, ha az elteresuk legfeljebb ennyi... */
    private const ABSOLUTE_TOLERANCE = 1e-4;

    /** ...vagy a nagyobbik ekkora reszenel (0,01 %) nem nagyobb. */
    private const RELATIVE_TOLERANCE = 1e-4;

    /** A szoveg szamkent, vagy null, ha nem (egyertelmuen) szam. */
    public static function parse(string $text): ?float
    {
        $compact = (string) preg_replace('/[\s\x{00A0}\x{202F}]+/u', '', $text);
        $percent = str_ends_with($compact, '%');

        if ($percent) {
            $compact = substr($compact, 0, -1);
        }

        if (preg_match('/^[+-]?(?:\d+(?:[.,]\d+)?|[.,]\d+)$/', $compact) !== 1) {
            return null;
        }

        $value = (float) str_replace(',', '.', $compact);

        return $percent ? $value / 100 : $value;
    }

    /** Nemnegativ egesz (darabszam, sorszam), vagy null. */
    public static function parseCount(string $text): ?int
    {
        $text = trim($text);

        return preg_match('/^\d{1,9}$/', $text) === 1 ? (int) $text : null;
    }

    public static function close(float $left, float $right): bool
    {
        $difference = abs($left - $right);

        return $difference <= self::ABSOLUTE_TOLERANCE
            || $difference <= self::RELATIVE_TOLERANCE * max(abs($left), abs($right));
    }

    /** Megjelenites a diaknak: tizedesvesszovel, folosleges nullak nelkul, legfeljebb hat tizedesjeggyel. */
    public static function format(float $value): string
    {
        if (is_nan($value) || is_infinite($value)) {
            return '?';
        }

        $text = number_format($value, 6, ',', '');
        $text = rtrim(rtrim($text, '0'), ',');

        return $text === '-0' || $text === '' ? '0' : $text;
    }
}
