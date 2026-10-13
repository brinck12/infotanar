<?php

declare(strict_types=1);

namespace App\Actions\Exams;

use App\Enums\ExamAttemptState;
use App\Exceptions\FileTasks\EvaluatorBusy;
use App\Models\ExamAttempt;
use App\Models\FileSubmission;
use App\Services\Exams\AttemptView;
use App\Services\Exams\PartScore;
use App\Services\Exams\PartScorer;
use App\Services\Exams\ResultWriter;
use App\Services\FileTasks\EvaluationGate;
use App\Services\FileTasks\FileEvaluator;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Support\Facades\DB;

/**
 * Egy beadott probalkozas ertekelese: a feltoltott fajlok az ertekelolap
 * szerint, a szerkesztos reszek a legjobb ervenyes kodbeadasbol; a nyers
 * pontbol vizsgapont lesz (lefele kerekitve), es a pillanatkep tarolodik.
 *
 * A fajlertekelesek az EvaluationGate egy helyen futnak (a tobbi feltoltessel
 * kozos keret). Ha nincs szabad hely, vagy az ertekeles elhasal, a probalkozas
 * `submitted` marad, es a CloseExpiredExamAttempts ujraprobalja.
 */
final readonly class EvaluateExamAttempt
{
    public function __construct(
        private PartScorer $scorer,
        private AttemptView $view,
        private FileEvaluator $evaluator,
        private EvaluationGate $gate,
        private ResultWriter $writer,
    ) {}

    /**
     * @throws EvaluatorBusy ha minden ertekelo hely foglalt
     */
    public function handle(ExamAttempt $attempt): ExamAttempt
    {
        if ($attempt->state !== ExamAttemptState::Submitted) {
            return $attempt;
        }

        $attempt->load(['exam.parts.exercise.rubricItems']);

        $scores = $this->gate->run(fn (): array => $this->scoreParts($attempt));

        return DB::transaction(function () use ($attempt, $scores): ExamAttempt {
            $locked = ExamAttempt::query()->lockForUpdate()->findOrFail($attempt->id);

            if ($locked->state !== ExamAttemptState::Submitted) {
                return $locked;
            }

            $this->writer->write($locked, $scores);
            $locked->state = ExamAttemptState::Evaluated;
            $locked->evaluated_at = CarbonImmutable::now();
            $locked->save();

            return $locked;
        });
    }

    /** @return list<PartScore> */
    private function scoreParts(ExamAttempt $attempt): array
    {
        /** @var EloquentCollection<int, FileSubmission> $files */
        $files = $attempt->fileSubmissions()->get();
        $uploads = $files->keyBy('exam_part_id');
        $best = $this->view->bestEditorSubmissions(new EloquentCollection([$attempt]))[$attempt->id] ?? [];
        $scores = [];

        foreach ($attempt->exam->parts as $part) {
            $exercise = $part->exercise;

            if ($exercise !== null && $exercise->kind->isEditorBased()) {
                $scores[] = $this->scorer->editorPart($part->id, $part->order(), $part->points, $best[$part->id] ?? null, $exercise->spec);

                continue;
            }

            $row = $uploads->get($part->id);

            if ($row !== null && $exercise !== null) {
                $this->evaluator->evaluate($exercise, $row->storedFile())->applyTo($row);
                $row->save();
            }

            $scores[] = $this->scorer->filePart($part->id, $part->order(), $part->points, $row);
        }

        return $scores;
    }
}
