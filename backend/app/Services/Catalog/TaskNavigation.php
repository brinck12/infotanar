<?php

declare(strict_types=1);

namespace App\Services\Catalog;

/**
 * Merre lehet tovabblepni egy feladatrol (#145). A `locked` a nezore
 * vonatkozik: zarolt celnal a kliens a paywallhoz visz.
 *
 * @phpstan-type ExerciseLink array{id: int, title: string, lesson_id: int, locked: bool}
 * @phpstan-type LessonLink array{slug: string, title: string, locked: bool}
 */
final readonly class TaskNavigation
{
    /**
     * @param  ExerciseLink|null  $previous  az elozo feladat a tanulasi sorrendben
     * @param  ExerciseLink|null  $next  a kovetkezo feladat (akar masik leckeben)
     * @param  LessonLink|null  $nextLesson  a feladat leckejet koveto lecke, akkor is, ha nincs feladata
     */
    public function __construct(
        public ?array $previous,
        public ?array $next,
        public ?array $nextLesson,
    ) {}

    /** @return array{previous: ExerciseLink|null, next: ExerciseLink|null, next_lesson: LessonLink|null} */
    public function toArray(): array
    {
        return ['previous' => $this->previous, 'next' => $this->next, 'next_lesson' => $this->nextLesson];
    }
}
