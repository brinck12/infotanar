<?php

declare(strict_types=1);

namespace App\Services\Execution\Comparison;

/**
 * Elemenkenti osszevetes: a kimenetet barmilyen szokoz menten elemekre bontjuk,
 * es az elemek sorozatat vetjuk ossze. A szokozok es a sortoresek szama nem szamit.
 *
 * Nem final: a NumericComparator csak azt cserelli, hogy ket elem mikor egyezik.
 */
class TokenComparator implements OutputComparator
{
    public function compare(string $actual, string $expected, ComparisonSettings $settings): Comparison
    {
        $actualTokens = OutputText::tokens($actual, $settings->caseInsensitive);
        $expectedTokens = OutputText::tokens($expected, $settings->caseInsensitive);

        if (count($actualTokens) !== count($expectedTokens)) {
            return Comparison::mismatch(__('execution.comparison.token_count', [
                'actual' => count($actualTokens),
                'expected' => count($expectedTokens),
            ]));
        }

        foreach ($expectedTokens as $index => $expectedToken) {
            if (! $this->same($actualTokens[$index], $expectedToken, $settings)) {
                return Comparison::mismatch(__('execution.comparison.token_differs', [
                    'position' => $index + 1,
                    'actual' => $actualTokens[$index],
                    'expected' => $expectedToken,
                ]));
            }
        }

        return Comparison::match();
    }

    /** Ket elem egyezik-e. Itt: szovegkent azonos. */
    protected function same(string $actual, string $expected, ComparisonSettings $settings): bool
    {
        return $actual === $expected;
    }
}
