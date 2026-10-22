<?php

declare(strict_types=1);

namespace App\Actions\Progress;

use App\Models\User;
use App\Services\Progress\StudyDays;
use App\Services\Progress\WeeklyRhythm;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Config;

/**
 * A heti ritmus (a het hetfotol vasarnapig, magyar ido szerint). A cel a tanulasi
 * celokban megadott heti oraszambol jon; megadott oraszam nelkul nincs cel.
 * A cel nem teljesulese sehol nem latszik: csak az elerese jelenik meg.
 */
final readonly class BuildWeeklyRhythm
{
    public function handle(User $user, ?CarbonImmutable $now = null): WeeklyRhythm
    {
        $timezone = Config::string('learning.timezone');
        $local = ($now ?? CarbonImmutable::now())->setTimezone($timezone);
        $weekStart = $local->startOfWeek()->startOfDay();

        $active = array_flip(StudyDays::forWeek($user, $weekStart));

        $days = [];
        for ($offset = 0; $offset < 7; $offset++) {
            $date = $weekStart->addDays($offset)->format('Y-m-d');
            $days[] = ['date' => $date, 'active' => isset($active[$date])];
        }

        $goalDays = $this->goalDays($user);

        return new WeeklyRhythm(
            weekStart: $weekStart,
            today: $local->format('Y-m-d'),
            days: $days,
            goalDays: $goalDays,
            goalReached: $goalDays !== null && count($active) >= $goalDays,
        );
    }

    private function goalDays(User $user): ?int
    {
        $hours = $user->preferences['weekly_hours'] ?? null;

        if (! is_string($hours)) {
            return null;
        }

        /** @var array<string, int> $goals */
        $goals = Config::array('learning.weekly_goal_days');

        return $goals[$hours] ?? null;
    }
}
