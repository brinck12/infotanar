<?php

declare(strict_types=1);

namespace App\Actions\Exams;

use App\Enums\ExamAttemptState;
use App\Models\ExamAttempt;
use App\Models\FileSubmission;
use App\Services\Exams\ExamResultRecalculator;
use App\Services\Exams\PartScore;
use App\Services\Exams\PartScorer;
use App\Services\Exams\ResultWriter;

/**
 * A kezi pontok jelolese (SaveManualMarks) utan ujraszamolja a vizsga
 * eredmenyet: csak a fajlos reszek, a feltoltott fajlok aktualis
 * pontszamabol. A szerkesztos reszek a beadaskor tarolt ertekeikkel maradnak,
 * mert a kodbeadasok a vizsga lezarasa utan mar nem szamitanak.
 *
 * A hivo tranzakciojaban fut. Nem ertekelt probalkozason nem csinal semmit.
 */
final readonly class RecomputeExamResult implements ExamResultRecalculator
{
    public function __construct(
        private PartScorer $scorer,
        private ResultWriter $writer,
    ) {}

    public function recompute(ExamAttempt $attempt): void
    {
        if ($attempt->state !== ExamAttemptState::Evaluated) {
            return;
        }

        $attempt->loadMissing('exam.parts.exercise');

        $stored = [];

        foreach ($this->writer->read($attempt) as $score) {
            $stored[$score->partId] = $score;
        }

        $uploads = FileSubmission::query()
            ->where('exam_attempt_id', $attempt->id)
            ->get()
            ->keyBy('exam_part_id');

        /** @var list<PartScore> $scores */
        $scores = [];

        foreach ($attempt->exam->parts as $part) {
            $exercise = $part->exercise;
            $isEditor = $exercise !== null && $exercise->kind->isEditorBased();

            $scores[] = $isEditor && isset($stored[$part->id])
                ? $stored[$part->id]
                : $this->scorer->filePart($part->id, $part->order(), $part->points, $uploads->get($part->id));
        }

        $this->writer->write($attempt, $scores);
        $attempt->save();
    }
}
