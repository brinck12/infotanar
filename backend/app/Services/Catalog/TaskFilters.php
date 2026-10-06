<?php

declare(strict_types=1);

namespace App\Services\Catalog;

use App\Enums\ExerciseProgressStatus;

/** A feladatlista szuroi (`GET /tasks`); a null szuro nem szukit. */
final readonly class TaskFilters
{
    /** A "meg nincs megoldva" szuro: a meg nem probalt es a sikertelenul probalt feladatok egyutt. */
    public const UNSOLVED = 'unsolved';

    /**
     * @param  string|null  $status  ExerciseProgressStatus erteke vagy UNSOLVED; csak bejelentkezett nezonel szur
     */
    public function __construct(
        public ?string $topicSlug = null,
        public ?string $level = null,
        public ?string $language = null,
        public ?int $difficulty = null,
        public ?string $status = null,
    ) {}

    /** @return list<string> */
    public static function statuses(): array
    {
        return [self::UNSOLVED, ExerciseProgressStatus::Solved->value, ExerciseProgressStatus::Attempted->value];
    }
}
