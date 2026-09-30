<?php

declare(strict_types=1);

namespace App\Services\Progress;

use App\Enums\LessonProgressStatus;
use App\Models\Track;

final readonly class TrackProgress
{
    /** @param array<int, LessonProgressStatus> $lessons lecke id => allapot */
    public function __construct(
        public Track $track,
        public ProgressSummary $summary,
        public array $lessons,
    ) {}
}
