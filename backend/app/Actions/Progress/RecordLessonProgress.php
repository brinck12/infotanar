<?php

declare(strict_types=1);

namespace App\Actions\Progress;

use App\Models\Exercise;
use App\Models\Lesson;
use App\Models\Submission;
use App\Models\User;

/**
 * Egy elfogadott beadas utan: ha a felhasznalonak a lecke minden publikalt
 * feladatara van sikeres beadasa, a lecke teljesitett. Jelenleg leckenkent
 * egy feladat van, de a szabaly tobb feladatos leckekre is helyes.
 */
final readonly class RecordLessonProgress
{
    public function __construct(private MarkLessonComplete $markLessonComplete) {}

    /** @return bool true, ha a lecke ezzel teljesult eloszor */
    public function handle(User $user, Lesson $lesson): bool
    {
        $exerciseIds = Exercise::query()
            ->where('lesson_id', $lesson->id)
            ->where('is_published', true)
            ->pluck('id');

        if ($exerciseIds->isEmpty()) {
            return false;
        }

        $solved = Submission::query()
            ->where('user_id', $user->id)
            ->where('status', 'passed')
            ->whereIn('exercise_id', $exerciseIds)
            ->distinct()
            ->count('exercise_id');

        return $solved === $exerciseIds->count() && $this->markLessonComplete->handle($user, $lesson);
    }
}
