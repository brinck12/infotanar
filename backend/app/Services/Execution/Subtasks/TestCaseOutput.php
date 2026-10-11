<?php

declare(strict_types=1);

namespace App\Services\Execution\Subtasks;

/** Egy lefutott teszteset kimenete a reszfeladatok pontozasahoz. */
final readonly class TestCaseOutput
{
    public function __construct(
        /** Rejtett teszteset: a kimeneterol es az elvart ertekerol semmi nem mehet ki. */
        public bool $hidden,
        public string $actual,
        public string $expected,
    ) {}
}
