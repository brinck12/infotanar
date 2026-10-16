<?php

declare(strict_types=1);

namespace App\Services\Catalog\Content;

final readonly class TrackNode
{
    /**
     * @param  array<string, mixed>  $attributes
     * @param  list<ModuleNode>  $modules
     */
    public function __construct(
        public string $path,
        public array $attributes,
        public array $modules,
    ) {}
}
