<?php

declare(strict_types=1);

namespace App\Services\Execution\Comparison;

/**
 * Mint az elemenkenti osszevetes, de a szamnak ertelmezheto elemeket (tizedesponttal
 * vagy tizedesvesszovel, pl. 3.5 vagy 3,50) az ertekuk szerint, turessel hasonlitja ossze.
 * Ketto elem akkor egyezik, ha |a - b| <= max(abs_tol, rel_tol * max(|a|, |b|)).
 * A nem szam elemek szovegkent hasonlitodnak.
 *
 * Az ezres tagolo nem tamogatott: a vessző mindig tizedesvessző.
 */
final class NumericComparator extends TokenComparator
{
    private const NUMBER = '/^[+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)(?:[eE][+-]?\d+)?$/';

    protected function same(string $actual, string $expected, ComparisonSettings $settings): bool
    {
        $actualNumber = $this->number($actual);
        $expectedNumber = $this->number($expected);

        if ($actualNumber === null || $expectedNumber === null) {
            return parent::same($actual, $expected, $settings);
        }

        $allowed = max($settings->absTol, $settings->relTol * max(abs($actualNumber), abs($expectedNumber)));

        // A kis epsilon a lebegopontos kerekitesi hibat fedi (pl. 0.1 + 0.2 vs 0.3).
        return abs($actualNumber - $expectedNumber) <= $allowed + 1e-12;
    }

    private function number(string $token): ?float
    {
        return preg_match(self::NUMBER, $token) === 1 ? (float) str_replace(',', '.', $token) : null;
    }
}
