<?php

declare(strict_types=1);

namespace App\Services\Progress;

final readonly class ProgressReport
{
    /** @param list<TrackProgress> $tracks */
    public function __construct(
        public ProgressSummary $overall,
        public array $tracks,
    ) {}
}
