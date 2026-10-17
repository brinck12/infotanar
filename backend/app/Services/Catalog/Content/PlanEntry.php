<?php

declare(strict_types=1);

namespace App\Services\Catalog\Content;

/** Egy elem terve: mi történne vele az importnál. */
final readonly class PlanEntry
{
    public const CREATE = 'create';

    public const UPDATE = 'update';

    public const UNCHANGED = 'unchanged';

    public const UNPUBLISH = 'unpublish';

    /**
     * @param  string  $kind  track|module|lesson|exercise
     * @param  string  $path  slug-útvonal: track/modul/lecke[/feladat]
     * @param  string  $action  create|update|unchanged|unpublish
     * @param  list<string>  $changedFields  csak `update` esetén: a módosuló mezők
     */
    public function __construct(
        public string $kind,
        public string $path,
        public string $action,
        public array $changedFields = [],
    ) {}
}
