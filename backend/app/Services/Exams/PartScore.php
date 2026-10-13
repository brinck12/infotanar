<?php

declare(strict_types=1);

namespace App\Services\Exams;

/**
 * Egy vizsgaresz pontozott eredmenye: a nyers pont es a vizsgapontra
 * atvaltott pont. A `toArray()` az `exam_attempts.result` egy eleme.
 */
final readonly class PartScore
{
    public function __construct(
        public int $partId,
        /** A resz 1-tol szamolt sorszama. */
        public int $order,
        /** Atvaltott vizsgapont (lefele kerekitve). */
        public int $score,
        /** A resz pontja a vizsgan (ennyi vizsgapontot er). */
        public int $maxScore,
        public int $rawScore,
        public int $rawMax,
        public ?string $summary,
        public ?int $fileSubmissionId,
        public ?int $submissionId,
        /** A meg nem jelolt kezi pontokbol szerezheto vizsgapont. */
        public int $pendingManualPoints = 0,
    ) {}

    /**
     * @return array{part_id: int, order: int, score: int, max_score: int, raw_score: int, raw_max: int, summary: string|null, file_submission_id: int|null, submission_id: int|null}
     */
    public function toArray(): array
    {
        return [
            'part_id' => $this->partId,
            'order' => $this->order,
            'score' => $this->score,
            'max_score' => $this->maxScore,
            'raw_score' => $this->rawScore,
            'raw_max' => $this->rawMax,
            'summary' => $this->summary,
            'file_submission_id' => $this->fileSubmissionId,
            'submission_id' => $this->submissionId,
        ];
    }
}
