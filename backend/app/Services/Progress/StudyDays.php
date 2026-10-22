<?php

declare(strict_types=1);

namespace App\Services\Progress;

use App\Models\LessonCompletion;
use App\Models\Submission;
use App\Models\User;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Illuminate\Support\Facades\Config;

/**
 * Azok a magyar naptari napok, amelyeken a felhasznalo tanult: lecketeljesites
 * vagy feladatbeadas (barmilyen statusszal) volt. Gyakorlo vizsgakiserlet nem szamit.
 * A napok hatara magyar ido szerint van (nem UTC): a vasarnap 23:30-as beadas vasarnapra esik.
 */
final class StudyDays
{
    /**
     * @param  CarbonImmutable  $weekStart  a het hetfoje, 00:00 magyar ido szerint
     * @return list<string> `Y-m-d` datumok, rendezve, egyedi
     */
    public static function forWeek(User $user, CarbonImmutable $weekStart): array
    {
        $timezone = Config::string('learning.timezone');
        $from = $weekStart->setTimezone($timezone)->startOfDay();
        // Naptari 7 nap, nem 168 ora: az oraallitas hetenek vasarnapja 23 vagy 25 oras.
        $until = $from->addDays(7)->startOfDay();

        $moments = [
            ...LessonCompletion::query()
                ->where('user_id', $user->id)
                ->where('completed_at', '>=', $from->utc())
                ->where('completed_at', '<', $until->utc())
                ->get(['completed_at'])
                ->map(static fn (LessonCompletion $completion): CarbonInterface => $completion->completed_at)
                ->all(),
            ...Submission::query()
                ->where('user_id', $user->id)
                ->where('created_at', '>=', $from->utc())
                ->where('created_at', '<', $until->utc())
                ->get(['created_at'])
                ->map(static fn (Submission $submission): ?CarbonInterface => $submission->created_at)
                ->filter()
                ->all(),
        ];

        $days = [];
        foreach ($moments as $moment) {
            $days[CarbonImmutable::instance($moment)->setTimezone($timezone)->format('Y-m-d')] = true;
        }

        $dates = array_keys($days);
        sort($dates);

        return $dates;
    }
}
