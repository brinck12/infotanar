<?php

declare(strict_types=1);

namespace App\Services\Execution;

use App\Models\Submission;
use App\Services\Execution\Subtasks\SubtaskScore;

final readonly class SubmissionOutcome
{
    /**
     * @param  list<string>  $violations  megsertett kodszabalyok (Constraint Violation eseten)
     * @param  list<SubtaskScore>|null  $subtasks  reszfeladatonkenti pontok a megjegyzesekkel; a tarolt sorban megjegyzes nincs
     */
    public function __construct(
        public Submission $submission,
        /** A beadas ezzel teljesitette-e eloszor a leckét. */
        public bool $lessonCompleted,
        public array $violations = [],
        public ?array $subtasks = null,
    ) {}
}
