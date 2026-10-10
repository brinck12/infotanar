<?php

declare(strict_types=1);

namespace App\Services\FileTasks\Grammar;

/**
 * Szovegek osszevetese az ertekelolap nyelvtana szerint (BACKEND.md 4.4.3):
 * kis- es nagybetu, ekezet es a szokozok mennyisege nem szamit. Igy a szerzo
 * ugy irhatja be az elvart erteket, ahogy a javitasi utmutatoban olvassa.
 */
final class Text
{
    /** Ekezetes betu => alapbetu (kisbetus alakok; a fold() elobb kisbetusit). */
    private const ACCENTS = [
        'á' => 'a', 'à' => 'a', 'â' => 'a', 'ä' => 'a', 'ã' => 'a', 'å' => 'a',
        'é' => 'e', 'è' => 'e', 'ê' => 'e', 'ë' => 'e',
        'í' => 'i', 'ì' => 'i', 'î' => 'i', 'ï' => 'i',
        'ó' => 'o', 'ò' => 'o', 'ô' => 'o', 'ö' => 'o', 'õ' => 'o', 'ő' => 'o',
        'ú' => 'u', 'ù' => 'u', 'û' => 'u', 'ü' => 'u', 'ű' => 'u',
        'ç' => 'c', 'ñ' => 'n', 'ý' => 'y', 'ß' => 'ss',
    ];

    /** Osszehasonlitasra kesz alak: kisbetus, ekezet nelkuli, a szokozok egyetlen szokozze vonva. */
    public static function fold(string $text): string
    {
        $folded = strtr(mb_strtolower($text, 'UTF-8'), self::ACCENTS);

        return trim((string) preg_replace('/[\s\x{00A0}\x{202F}]+/u', ' ', $folded));
    }

    public static function equals(string $left, string $right): bool
    {
        return self::fold($left) === self::fold($right);
    }

    /** Ures keresett szoveg semmit nem igazol, ezert hamis. */
    public static function contains(string $haystack, string $needle): bool
    {
        $needle = self::fold($needle);

        return $needle !== '' && str_contains(self::fold($haystack), $needle);
    }

    /**
     * Az elvart szoveg illesztese a talaltra: `~reszlet` tartalmazast, minden
     * mas teljes egyezest jelent.
     */
    public static function matches(string $found, string $expected): bool
    {
        return str_starts_with($expected, '~')
            ? self::contains($found, substr($expected, 1))
            : self::equals($found, $expected);
    }
}
