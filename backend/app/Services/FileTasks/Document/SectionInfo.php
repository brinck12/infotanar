<?php

declare(strict_types=1);

namespace App\Services\FileTasks\Document;

/** Egy szakasz: lapméret, margók, oszlopok és hogyan kezdődik. Ismeretlen adat: null. */
final readonly class SectionInfo
{
    public function __construct(
        public ?float $widthMm,
        public ?float $heightMm,
        public ?float $marginTopMm,
        public ?float $marginBottomMm,
        public ?float $marginLeftMm,
        public ?float $marginRightMm,
        public int $columns,
        /** page | continuous | even | odd: a szakasz kezdete. */
        public string $breakType,
    ) {}

    public function isLandscape(): ?bool
    {
        return $this->widthMm === null || $this->heightMm === null ? null : $this->widthMm > $this->heightMm;
    }
}
