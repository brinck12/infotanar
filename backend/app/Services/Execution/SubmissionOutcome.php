<?php

declare(strict_types=1);

namespace App\Services\Execution;

use App\Models\Submission;

final readonly class SubmissionOutcome
{
    public function __construct(
        public Submission $submission,
        /** A beadas ezzel teljesitette-e eloszor a leckét. */
        public bool $lessonCompleted,
    ) {}
}
