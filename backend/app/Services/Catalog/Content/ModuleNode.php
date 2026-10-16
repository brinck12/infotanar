<?php

declare(strict_types=1);

namespace App\Services\Catalog\Content;

final readonly class ModuleNode
{
    /**
     * @param  array<string, mixed>  $attributes
     * @param  list<LessonNode>  $lessons
     */
    public function __construct(
        public string $path,
        public array $attributes,
        public array $lessons,
    ) {}
}
