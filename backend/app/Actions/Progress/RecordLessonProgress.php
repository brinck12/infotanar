<?php

declare(strict_types=1);

namespace App\Actions\Progress;

use App\Enums\ExerciseKind;
use App\Models\Exercise;
use App\Models\Lesson;
use App\Models\User;
use App\Services\Progress\ExerciseAttempts;

/**
 * Egy elfogadott beadas utan: ha a felhasznalonak a lecke minden publikalt,
 * szerveren ertekelt (kod, SQL, fajlfeltoltos) feladatara van sikeres beadasa,
 * a lecke teljesitett. A bongeszos fajtak nem szamitanak (8.11), a vizsgasorok
 * sem. Jelenleg leckenkent egy feladat van, de a szabaly tobb feladatos
 * leckekre is helyes.
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
            ->whereIn('kind', ExerciseKind::gradableValues())
            ->get(['id'])
            ->map(static fn (Exercise $exercise): int => $exercise->id);

        if ($exerciseIds->isEmpty()) {
            return false;
        }

        $solvedIds = ExerciseAttempts::solvedBy($user)->flip();
        $solved = $exerciseIds->filter(static fn (mixed $id): bool => $solvedIds->has($id))->count();

        return $solved === $exerciseIds->count() && $this->markLessonComplete->handle($user, $lesson);
    }
}
