<?php

declare(strict_types=1);

namespace App\Actions\Catalog;

use App\Models\Lesson;
use App\Models\Track;
use Illuminate\Support\Facades\Config;

/**
 * A track elso N leckejet (modul-, majd lecke-sorrendben) ingyenesse teszi.
 * A tobbi lecke jeloleset nem bantja, igy a kezzel beallitott ingyenes
 * leckek megmaradnak.
 */
final class ApplyFreemiumDefaults
{
    public function handle(Track $track): void
    {
        $freeLessonIds = Lesson::query()
            ->join('modules', 'modules.id', '=', 'lessons.module_id')
            ->where('modules.track_id', $track->id)
            ->orderBy('modules.position')
            ->orderBy('lessons.position')
            ->orderBy('lessons.id')
            ->limit(Config::integer('catalog.free_lessons_per_track'))
            ->pluck('lessons.id');

        Lesson::query()->whereKey($freeLessonIds)->update(['is_free' => true]);
    }
}
