<?php

declare(strict_types=1);

namespace App\Services\FileTasks\Presentation;

use App\Services\FileTasks\Grammar\Booleans;
use App\Services\FileTasks\Grammar\Colors;
use App\Services\FileTasks\Grammar\Lengths;
use App\Services\FileTasks\Grammar\Numbers;

/**
 * Az `expected` ertek nyelvtana a bemutato-, vektor-, web- es kepvizsgalatokhoz:
 * minden tipushoz egy `parse*` (az ertek, vagy null) es egy `*Error` (magyar
 * hibauzenet szerkeszteskor, vagy null) par. A validate() es az evaluate()
 * ugyanezt hasznalja, igy amit el lehet menteni, azt ki is lehet ertekelni.
 */
final class Expected
{
    /** A relativ eltérés, amin belul ket kepmeretarany egyezik. */
    private const RATIO_TOLERANCE = 0.02;

    /** A szazalekos ertekek (atlatszosag) megengedett elterese szazalekpontban. */
    public const PERCENT_TOLERANCE = 1.0;

    /** A betumeret megengedett elterese (pt). */
    public const POINT_TOLERANCE = 0.5;

    /** Idotartamok megengedett elterese (mp). */
    public const SECONDS_TOLERANCE = 0.05;

    /** @return array{operator: string, value: int}|null */
    public static function parseComparison(string $expected): ?array
    {
        if (preg_match('/^\s*(>=|<=|>|<|=)?\s*(\d{1,9})\s*$/', $expected, $match) !== 1) {
            return null;
        }

        return ['operator' => $match[1] === '' ? '=' : $match[1], 'value' => (int) $match[2]];
    }

    public static function holds(int $actual, string $expected): bool
    {
        $comparison = self::parseComparison($expected);

        return $comparison !== null && match ($comparison['operator']) {
            '>=' => $actual >= $comparison['value'],
            '<=' => $actual <= $comparison['value'],
            '>' => $actual > $comparison['value'],
            '<' => $actual < $comparison['value'],
            default => $actual === $comparison['value'],
        };
    }

    public static function comparisonError(string $expected): ?string
    {
        return self::parseComparison($expected) === null ? Message::get('expected_count') : null;
    }

    public static function lengthError(string $expected): ?string
    {
        return Lengths::toMillimetres($expected) === null ? Message::get('expected_length') : null;
    }

    public static function colorError(string $expected, bool $allowNone = false): ?string
    {
        if ($allowNone && self::isNone($expected)) {
            return null;
        }

        return Colors::parse($expected) === null ? Message::get('expected_color') : null;
    }

    public static function isNone(string $expected): bool
    {
        return in_array(mb_strtolower(trim($expected)), ['nincs', 'none', 'nem', 'átlátszó'], true);
    }

    /** Szazalek (30 vagy 30%): a szam szazalekpontban. */
    public static function parsePercent(string $expected): ?float
    {
        $text = rtrim(trim($expected), '%');
        $number = Numbers::parse($text);

        return $number !== null && $number >= 0.0 && $number <= 100.0 ? $number : null;
    }

    public static function percentError(string $expected): ?string
    {
        return self::parsePercent($expected) === null ? Message::get('expected_percent') : null;
    }

    /** Pontokban megadott szam (44 vagy 44pt). */
    public static function parsePoints(string $expected): ?float
    {
        $text = trim($expected);
        $text = preg_replace('/\s*pt$/i', '', $text) ?? $text;
        $number = Numbers::parse($text);

        return $number !== null && $number > 0.0 ? $number : null;
    }

    public static function pointsError(string $expected): ?string
    {
        return self::parsePoints($expected) === null ? Message::get('expected_points') : null;
    }

    /** Idotartam masodpercben (0,5 vagy 0,5s, 0,5 mp, 500ms). */
    public static function parseSeconds(string $expected): ?float
    {
        if (preg_match('/^\s*([+]?\d+(?:[.,]\d+)?)\s*(ms|s|mp|sec)?\s*$/i', $expected, $match) !== 1) {
            return null;
        }

        $value = (float) str_replace(',', '.', $match[1]);

        return strtolower($match[2] ?? '') === 'ms' ? $value / 1000 : $value;
    }

    public static function secondsError(string $expected): ?string
    {
        return self::parseSeconds($expected) === null ? Message::get('expected_seconds') : null;
    }

    /** Kepmeretarany: "4:3", "16:9" vagy tizedes szam ("1,5"); szelesseg / magassag. */
    public static function parseRatio(string $expected): ?float
    {
        $text = trim($expected);

        if (preg_match('/^(\d+(?:[.,]\d+)?)\s*[:\/x×]\s*(\d+(?:[.,]\d+)?)$/u', $text, $match) === 1) {
            $height = (float) str_replace(',', '.', $match[2]);

            return $height > 0.0 ? (float) str_replace(',', '.', $match[1]) / $height : null;
        }

        $number = Numbers::parse($text);

        return $number !== null && $number > 0.0 ? $number : null;
    }

    public static function ratioError(string $expected): ?string
    {
        return self::parseRatio($expected) === null ? Message::get('expected_ratio') : null;
    }

    public static function ratiosClose(float $actual, float $expected): bool
    {
        return abs($actual - $expected) <= self::RATIO_TOLERANCE * $expected;
    }

    public static function booleanError(string $expected): ?string
    {
        return Booleans::parse($expected) === null ? Message::get('expected_boolean') : null;
    }

    public static function textError(string $expected): ?string
    {
        $text = ltrim(trim($expected), '~');

        return trim($text) === '' ? Message::get('expected_text') : null;
    }

    /** A szoveg roviditve, a "found" mezoben valo megjeleniteshez (egy sor). */
    public static function excerpt(string $text, int $length = 60): string
    {
        $line = trim((string) preg_replace('/\s+/u', ' ', $text));

        return mb_strimwidth($line, 0, $length, '…', 'UTF-8');
    }

    public static function formatSeconds(float $seconds): string
    {
        return Numbers::format(round($seconds, 2)).' mp';
    }
}
