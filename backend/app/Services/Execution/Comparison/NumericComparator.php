<?php

declare(strict_types=1);

namespace App\Services\Execution\Comparison;

/**
 * Mint az elemenkenti osszevetes, de a szamnak ertelmezheto elemeket az
 * ertekuk szerint hasonlitja ossze: a tizedespont es a tizedesvesszo, a
 * 3.50 es a 3,5 ugyanaz. Ket szam egyezik, ha
 * |a - b| <= max(abs_tol, rel_tol * max(|a|, |b|)). A nem szam elemek
 * szovegkent hasonlitodnak.
 *
 * Ezres tagolot nem ismer: a vesszo mindig tizedesvesszo, es csak szamjegyek
 * kozott szamit annak (az "1," felsorolas-elem szoveg marad).
 */
final class NumericComparator implements OutputComparator
{
    private const INTEGER = '/^[+-]?\d+$/';

    private const NUMBER = '/^[+-]?\d+(?:[.,]\d+)?(?:[eE][+-]?\d+)?$/';

    public function compare(string $actual, string $expected, ComparisonSettings $settings): ComparisonResult
    {
        return TokenSequence::compare(
            OutputText::tokens($actual, $settings),
            OutputText::tokens($expected, $settings),
            fn (string $actualToken, string $expectedToken): bool => $this->same($actualToken, $expectedToken, $settings),
        );
    }

    private function same(string $actual, string $expected, ComparisonSettings $settings): bool
    {
        if ($actual === $expected) {
            return true;
        }

        if (preg_match(self::NUMBER, $actual) !== 1 || preg_match(self::NUMBER, $expected) !== 1) {
            return false;
        }

        // Tures nelkul az egesz szamokat szamjegyenkent vetjuk ossze: a nagy
        // egeszek (pl. faktorialis) lebegopontos szamkent osszemosodnanak.
        if ($settings->absTol === 0.0 && $settings->relTol === 0.0
            && preg_match(self::INTEGER, $actual) === 1 && preg_match(self::INTEGER, $expected) === 1) {
            return $this->canonicalInteger($actual) === $this->canonicalInteger($expected);
        }

        $actualNumber = (float) str_replace(',', '.', $actual);
        $expectedNumber = (float) str_replace(',', '.', $expected);
        $magnitude = max(abs($actualNumber), abs($expectedNumber));

        // A kis raadas a lebegopontos kerekitest fedi (0.1 + 0.2 kontra 0.3, vagy 3.15 - 3.14 kontra 0.01).
        return abs($actualNumber - $expectedNumber)
            <= max($settings->absTol, $settings->relTol * $magnitude) + 2 * PHP_FLOAT_EPSILON * $magnitude;
    }

    /** Elojel es vezeto nullak nelkuli alak: "+007" es "7" ugyanaz, "-0" es "0" is. */
    private function canonicalInteger(string $token): string
    {
        $digits = ltrim(ltrim($token, '+-'), '0');

        if ($digits === '') {
            return '0';
        }

        return ($token[0] === '-' ? '-' : '').$digits;
    }
}
