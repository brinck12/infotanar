<?php

declare(strict_types=1);

namespace App\Services\Catalog\Content;

/** A fájlok és az adatbázis összevetésének eredménye. */
final readonly class ImportPlan
{
    /**
     * @param  list<PlanEntry>  $entries  a fa elemei fa-sorrendben (create|update|unchanged)
     * @param  list<PlanEntry>  $unpublish  a fájlokból eltűnt, de még publikált lecke/feladat
     */
    public function __construct(
        public array $entries,
        public array $unpublish,
    ) {}

    public function count(string $kind, string $action): int
    {
        $all = [...$this->entries, ...$this->unpublish];

        return count(array_filter(
            $all,
            static fn (PlanEntry $entry): bool => $entry->kind === $kind && $entry->action === $action,
        ));
    }
}
