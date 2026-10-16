<?php

declare(strict_types=1);

namespace App\Services\Catalog\Content;

/** Egy import eredménye: hány elem jött létre, módosult, illetve lett nem publikált. */
final readonly class ImportSummary
{
    public function __construct(
        public int $created,
        public int $updated,
        public int $unpublished,
    ) {}

    public function total(): int
    {
        return $this->created + $this->updated + $this->unpublished;
    }
}
