<?php

declare(strict_types=1);

namespace App\Services\Progress;

/** A heti osszefoglalo level tartalma: csak ami tortent, hianyrol nincs benne semmi. */
final readonly class WeeklySummary
{
    public function __construct(
        public int $activeDays,
        public int $lessonsCompleted,
        public int $submissions,
    ) {}
}
