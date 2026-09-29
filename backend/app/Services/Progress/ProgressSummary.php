<?php

declare(strict_types=1);

namespace App\Services\Progress;

final readonly class ProgressSummary
{
    public function __construct(
        public int $completed,
        public int $total,
    ) {}

    /** Lefele kerekitve: 100% csak akkor, ha tenyleg minden kesz. */
    public function percent(): int
    {
        return $this->total === 0 ? 0 : intdiv($this->completed * 100, $this->total);
    }
}
