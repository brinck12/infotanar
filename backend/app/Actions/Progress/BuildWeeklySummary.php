<?php

declare(strict_types=1);

namespace App\Actions\Progress;

use App\Models\LessonCompletion;
use App\Models\Submission;
use App\Models\User;
use App\Services\Progress\StudyDays;
use App\Services\Progress\WeeklySummary;
use Carbon\CarbonImmutable;

/** A heti osszefoglalo adatai; NULL, ha a heten nem volt tanulasi nap (akkor nem megy level). */
final readonly class BuildWeeklySummary
{
    public function handle(User $user, CarbonImmutable $weekStart): ?WeeklySummary
    {
        $activeDays = count(StudyDays::forWeek($user, $weekStart));

        if ($activeDays === 0) {
            return null;
        }

        [$from, $until] = StudyDays::bounds($weekStart);

        return new WeeklySummary(
            activeDays: $activeDays,
            lessonsCompleted: LessonCompletion::query()
                ->where('user_id', $user->id)
                ->where('completed_at', '>=', $from)
                ->where('completed_at', '<', $until)
                ->count(),
            submissions: Submission::query()
                ->where('user_id', $user->id)
                ->where('created_at', '>=', $from)
                ->where('created_at', '<', $until)
                ->count(),
        );
    }
}
