<?php

declare(strict_types=1);

namespace App\Services\FileTasks\Document;

/** Egy táblázat összefoglalója. Ismeretlen adat: null. */
final readonly class TableInfo
{
    /** @param  list<string>  $shadingColors a cellák kitöltése (kanonikus hexa), az egyedi értékek */
    public function __construct(
        public int $rows,
        public int $columns,
        public bool $border,
        public ?float $widthMm,
        public ?float $heightMm,
        public array $shadingColors,
        /** left | center | right */
        public string $alignment,
    ) {}
}
