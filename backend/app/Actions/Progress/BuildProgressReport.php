<?php

declare(strict_types=1);

namespace App\Actions\Progress;

use App\Enums\LessonProgressStatus;
use App\Models\Track;
use App\Models\User;
use App\Services\Progress\LessonStatuses;
use App\Services\Progress\ProgressReport;
use App\Services\Progress\ProgressSummary;
use App\Services\Progress\TrackProgress;
use Illuminate\Database\Eloquent\Relations\Relation;

/**
 * Haladas a publikalt track-ek publikalt leckeire: track-enkent es osszesen.
 * Allando szamu lekerdezes (track-ek, modulok, leckek, teljesitesek,
 * beadasok), a katalogus meretetol fuggetlenul.
 */
final class BuildProgressReport
{
    public function handle(User $user): ProgressReport
    {
        $tracks = Track::query()
            ->published()
            ->with([
                'modules:id,track_id,position',
                'modules.lessons' => static fn (Relation $query) => $query->where('is_published', true)->select(['id', 'module_id', 'position']),
            ])
            ->orderBy('position')
            ->get();

        $lessonStatuses = LessonStatuses::forUser($user);

        $trackReports = [];
        $completedTotal = 0;
        $lessonTotal = 0;

        foreach ($tracks as $track) {
            $statuses = [];
            foreach ($track->modules as $module) {
                foreach ($module->lessons as $lesson) {
                    $statuses[$lesson->id] = $lessonStatuses->of($lesson->id);
                }
            }

            $done = count(array_filter($statuses, static fn (LessonProgressStatus $s): bool => $s === LessonProgressStatus::Completed));
            $completedTotal += $done;
            $lessonTotal += count($statuses);

            $trackReports[] = new TrackProgress($track, new ProgressSummary($done, count($statuses)), $statuses);
        }

        return new ProgressReport(new ProgressSummary($completedTotal, $lessonTotal), $trackReports);
    }
}
