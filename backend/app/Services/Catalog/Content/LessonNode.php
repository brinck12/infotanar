<?php

declare(strict_types=1);

namespace App\Services\Catalog\Content;

/** Egy beolvasott `lesson.md`: a fejléc mezői és a törzs (szó szerint). */
final readonly class LessonNode
{
    /**
     * @param  array<string, mixed>  $attributes
     * @param  list<ExerciseNode>  $exercises
     */
    public function __construct(
        public string $path,
        public array $attributes,
        public string $content,
        public array $exercises,
        public ?string $reviewedBy,
        public ?string $reviewedAt,
    ) {}
}
