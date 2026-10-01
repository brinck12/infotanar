<?php

declare(strict_types=1);

namespace App\Services\Execution\Comparison;

/** A program kimenetenek osszevetese az elvarttal; modonkent egy implementacio (#155). */
interface OutputComparator
{
    public function compare(string $actual, string $expected, ComparisonSettings $settings): Comparison;
}
