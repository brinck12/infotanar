<?php

declare(strict_types=1);

namespace App\Services\Execution\Comparison;

/**
 * Elemenkenti osszevetes: a kimenetet szokozok menten elemekre bontjuk, es az
 * elemek sorozatat vetjuk ossze szovegkent. A szokozok es a sortoresek szama
 * nem szamit.
 */
final class TokenComparator implements OutputComparator
{
    public function compare(string $actual, string $expected, ComparisonSettings $settings): ComparisonResult
    {
        return TokenSequence::compare(
            OutputText::tokens($actual, $settings),
            OutputText::tokens($expected, $settings),
            static fn (string $actualToken, string $expectedToken): bool => $actualToken === $expectedToken,
        );
    }
}
