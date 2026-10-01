<?php

declare(strict_types=1);

namespace App\Services\Execution\Comparison;

use App\Enums\ComparisonMode;

/** A feladat beallitasa szerinti osszehasonlito kivalasztasa (#155). Uj mod: uj osztaly es egy sor itt. */
final readonly class OutputComparators
{
    public function __construct(
        private ExactComparator $exact,
        private TokenComparator $tokens,
        private NumericComparator $numeric,
    ) {}

    public function for(ComparisonSettings $settings): OutputComparator
    {
        return match ($settings->mode) {
            ComparisonMode::Exact => $this->exact,
            ComparisonMode::Tokens => $this->tokens,
            ComparisonMode::Numeric => $this->numeric,
        };
    }
}
