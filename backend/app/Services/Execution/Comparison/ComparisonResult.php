<?php

declare(strict_types=1);

namespace App\Services\Execution\Comparison;

/** Egy osszevetes eredmenye: egyezik-e, es ha nem, mi tert el (ha az osszehasonlito meg tudja mondani). */
final readonly class ComparisonResult
{
    private function __construct(
        public bool $matches,
        /**
         * Magyar, a diaknak szolo leiras az elso elteresrol. Az elvart kimenet
         * egy darabjat tartalmazza, ezert csak lathato tesztesetnel mehet ki
         * (a HiddenResultRedactor a rejtettekbol kiszuri).
         */
        public ?string $difference = null,
    ) {}

    public static function match(): self
    {
        return new self(true);
    }

    public static function mismatch(?string $difference = null): self
    {
        return new self(false, $difference);
    }
}
