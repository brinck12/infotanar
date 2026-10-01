<?php

declare(strict_types=1);

namespace App\Services\Progress;

use App\Enums\LessonProgressStatus;
use App\Models\LessonCompletion;
use App\Models\Submission;
use App\Models\User;

/**
 * Egy felhasznalo leckeinek allapota. Ket lekerdezesbol all ossze (teljesitett
 * leckek, megkezdett leckek), a katalogus meretetol fuggetlenul; a haladas
 * oldal es a tananyag-nezet ugyanezt hasznalja.
 */
final readonly class LessonStatuses
{
    /**
     * @param  array<int, true>  $completed  teljesitett leckek azonositoi
     * @param  array<int, true>  $attempted  leckek, amelyek valamelyik feladatara van beadas
     */
    private function __construct(
        private array $completed,
        private array $attempted,
    ) {}

    public static function forUser(User $user): self
    {
        $completed = LessonCompletion::query()->where('user_id', $user->id)->pluck('lesson_id');

        $attempted = Submission::query()
            ->join('exercises', 'exercises.id', '=', 'submissions.exercise_id')
            ->where('submissions.user_id', $user->id)
            ->distinct()
            ->pluck('exercises.lesson_id');

        return new self(self::idSet($completed->all()), self::idSet($attempted->all()));
    }

    public function of(int $lessonId): LessonProgressStatus
    {
        return match (true) {
            isset($this->completed[$lessonId]) => LessonProgressStatus::Completed,
            isset($this->attempted[$lessonId]) => LessonProgressStatus::InProgress,
            default => LessonProgressStatus::NotStarted,
        };
    }

    /**
     * @param  array<array-key, mixed>  $ids
     * @return array<int, true>
     */
    private static function idSet(array $ids): array
    {
        $set = [];

        foreach ($ids as $id) {
            if (is_numeric($id)) {
                $set[(int) $id] = true;
            }
        }

        return $set;
    }
}
