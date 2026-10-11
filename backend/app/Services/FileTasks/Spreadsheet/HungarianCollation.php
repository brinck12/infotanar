<?php

declare(strict_types=1);

namespace App\Services\FileTasks\Spreadsheet;

/**
 * Magyar ABC szerinti szovegosszehasonlitas, ugy ahogy az Excel es a
 * LibreOffice magyar nyelvi beallitassal rendez: a cs, dz, dzs, gy, ly, ny,
 * sz, ty, zs onallo betu ("Cukor" a "Csaba" elott all), az ekezetes
 * magánhangzo az elso korben egyezik az ekezet nelkulivel, es csak azonos
 * alapbetuk eseten dont: a rovid a hosszu elott all (a < á, o < ó, ö < ő).
 *
 * Nem fugg az intl bovitmenytol. A nagy- es kisbetu nem szamit.
 */
final class HungarianCollation
{
    /** Hosszabb jegy elobb: a dzs elobb dz + s-ként ne tokenizalodjon. */
    private const TOKENS = '/dzs|cs|dz|gy|ly|ny|sz|ty|zs|./su';

    /** A magyar ABC betui sorrendben (az ekezetes magánhangzok az alapbetujuk helyen). */
    private const ORDER = [
        'a', 'b', 'c', 'cs', 'd', 'dz', 'dzs', 'e', 'f', 'g', 'gy', 'h', 'i', 'j', 'k', 'l', 'ly', 'm',
        'n', 'ny', 'o', 'ö', 'p', 'q', 'r', 's', 'sz', 't', 'ty', 'u', 'ü', 'v', 'w', 'x', 'y', 'z', 'zs',
    ];

    /** Ekezetes betu => [alapbetu, masodlagos rang]: a rovid 0, a hosszu 1. */
    private const ACCENTED = [
        'á' => ['a', 1], 'é' => ['e', 1], 'í' => ['i', 1], 'ó' => ['o', 1], 'ő' => ['ö', 1], 'ú' => ['u', 1], 'ű' => ['ü', 1],
    ];

    /** Negativ, nulla vagy pozitiv, ahogy $left a magyar ABC-ben $right elott all, egyenlo, vagy utana all. */
    public static function compare(string $left, string $right): int
    {
        [$leftPrimary, $leftSecondary] = self::keys($left);
        [$rightPrimary, $rightSecondary] = self::keys($right);

        return self::lexicographic($leftPrimary, $rightPrimary) ?: self::lexicographic($leftSecondary, $rightSecondary);
    }

    /**
     * Elemenkenti osszehasonlitas; a rovidebb lista, ha a kozos resz egyezik, elobb all.
     * (A PHP `<=>` tombokon elobb a hosszt hasonlitana, az itt hibas volna.)
     *
     * @param  list<int>  $left
     * @param  list<int>  $right
     */
    private static function lexicographic(array $left, array $right): int
    {
        foreach ($left as $index => $value) {
            if (! isset($right[$index])) {
                return 1;
            }

            if ($value !== $right[$index]) {
                return $value <=> $right[$index];
            }
        }

        return count($left) <=> count($right);
    }

    /**
     * @return array{0: list<int>, 1: list<int>} [elsodleges rangok, masodlagos (ekezet) rangok]
     */
    private static function keys(string $text): array
    {
        $ranks = array_flip(self::ORDER);
        $primary = [];
        $secondary = [];
        preg_match_all(self::TOKENS, mb_strtolower(trim($text), 'UTF-8'), $matches);

        foreach ($matches[0] as $token) {
            [$base, $accent] = self::ACCENTED[$token] ?? [$token, 0];

            // Nem betu (szamjegy, szokoz, jel): a betuk elott, kodpont szerint; ismeretlen betu a vegen.
            $primary[] = $ranks[$base] ?? (self::isLetter($base) ? 1000 + self::codepoint($base) : self::codepoint($base) - 100000);
            $secondary[] = $accent;
        }

        return [$primary, $secondary];
    }

    private static function isLetter(string $character): bool
    {
        return preg_match('/^\p{L}$/u', $character) === 1;
    }

    private static function codepoint(string $character): int
    {
        return mb_ord($character, 'UTF-8') ?: 0;
    }
}
