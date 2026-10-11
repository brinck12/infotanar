<?php

declare(strict_types=1);

namespace App\Services\Execution\Comparison;

/**
 * Ket kimenet osszevetese a beallitas szerinti modon. Ezt hasznalja a
 * tesztesetek itelete es a reszfeladatok pontozasa is, igy a ketto soha nem
 * ter el egymastol. Uj mod: uj osztaly es egy sor a `for()`-ban.
 */
final readonly class OutputComparators
{
    public function __construct(
        private ExactComparator $exact,
        private TokenComparator $tokens,
        private NumericComparator $numeric,
    ) {}

    public function compare(string $actual, string $expected, ComparisonSettings $settings): ComparisonResult
    {
        return $this->for($settings->mode)->compare($actual, $expected, $settings);
    }

    private function for(ComparisonMode $mode): OutputComparator
    {
        return match ($mode) {
            ComparisonMode::Exact => $this->exact,
            ComparisonMode::Tokens => $this->tokens,
            ComparisonMode::Numeric => $this->numeric,
        };
    }
}
