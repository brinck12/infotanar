<?php

declare(strict_types=1);

namespace App\Actions\Admin\Catalog;

use App\Services\Execution\Comparison\Comparison;
use App\Services\Execution\Comparison\ComparisonSettings;
use App\Services\Execution\Comparison\OutputComparators;

/** Ket szoveg osszevetese adott beallitasokkal, ugyanazzal az osszehasonlitoval, amit a kiertekeles hasznal. */
final readonly class CheckOutputComparison
{
    public function __construct(private OutputComparators $comparators) {}

    public function handle(ComparisonSettings $settings, string $actual, string $expected): Comparison
    {
        return $this->comparators->for($settings)->compare($actual, $expected, $settings);
    }
}
