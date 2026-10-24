<?php

declare(strict_types=1);

namespace App\Services\Progress;

use Carbon\CarbonImmutable;

/** Egy felhasznalo aktualis hete: mely napokon tanult, es elerte-e a (halk) heti celt. */
final readonly class WeeklyRhythm
{
    /**
     * @param  list<array{date: string, active: bool}>  $days  hetfotol vasarnapig, hat nap
     */
    public function __construct(
        public CarbonImmutable $weekStart,
        public string $today,
        public array $days,
        public ?int $goalDays,
        public bool $goalReached,
    ) {}
}
