<?php

declare(strict_types=1);

namespace App\Services\Exams;

use App\Models\ExamAttempt;
use App\Models\FileSubmission;
use App\Models\Submission;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Support\Carbon;

/**
 * Egy vagy tobb probalkozas allapota a reszek szerint: melyik reszhez van
 * mar feltoltott fajl vagy ervenyes kodbeadas. Ebbol lesz a valasz
 * `submissions` listaja es a vizsgalista `completed_parts` mezoje.
 *
 * Lekerdezesek szama allando (nem probalkozasonkent): egy a fajlbeadasokra,
 * egy a kodbeadasokra, es a vizsga reszeinek betoltese.
 */
final readonly class AttemptView
{
    /** A szerkesztos resz beadasanak nevadasa nyelv szerint. */
    private const EDITOR_FILE_EXTENSION = ['python' => 'py', 'csharp' => 'cs', 'sql' => 'sql'];

    public function __construct(
        private AttemptClock $clock,
        private PartScorer $scorer,
    ) {}

    /** Egyetlen probalkozas allapota. */
    public function one(ExamAttempt $attempt): AttemptProgress
    {
        return $this->many(new EloquentCollection([$attempt]))[$attempt->id];
    }

    /**
     * @param  EloquentCollection<int, ExamAttempt>  $attempts
     * @return array<int, AttemptProgress> probalkozas azonosito => allapot
     */
    public function many(EloquentCollection $attempts): array
    {
        if ($attempts->isEmpty()) {
            return [];
        }

        $attempts->loadMissing('exam.parts.exercise');

        $files = $this->uploads($attempts);
        $code = $this->bestEditorSubmissions($attempts);
        $views = [];

        foreach ($attempts as $attempt) {
            $parts = [];

            foreach ($attempt->exam->parts as $part) {
                $upload = $files[$attempt->id][$part->id] ?? null;
                $submission = $code[$attempt->id][$part->id] ?? null;

                if ($upload !== null) {
                    $parts[] = new PartProgress($part->id, $part->order(), $upload->original_name, $upload->created_at);
                } elseif ($submission !== null) {
                    $parts[] = new PartProgress($part->id, $part->order(), $this->editorFileName($submission), $submission->created_at);
                }
            }

            $views[$attempt->id] = new AttemptProgress($attempt, $parts);
        }

        return $views;
    }

    /**
     * Szerkesztos reszenkent a legjobb ervenyes kodbeadas: a felhasznalo
     * beadasai a feladatra, `passed`/`failed` allapotban, a probalkozas
     * idoablakaban (kezdestol a beadasig, vizsgahelyzetben legfeljebb a
     * hatarido + turelmi idoig).
     *
     * @param  EloquentCollection<int, ExamAttempt>  $attempts  az `exam.parts.exercise` betoltve
     * @return array<int, array<int, Submission>> probalkozas azonosito => resz azonosito => beadas
     */
    public function bestEditorSubmissions(EloquentCollection $attempts): array
    {
        $userIds = [];
        $exerciseIds = [];
        $earliest = null;

        foreach ($attempts as $attempt) {
            foreach ($attempt->exam->parts as $part) {
                if ($part->exercise !== null && $part->exercise->kind->isEditorBased()) {
                    $exerciseIds[$part->exercise->id] = $part->exercise->id;
                    $userIds[$attempt->user_id] = $attempt->user_id;
                    $earliest = $earliest === null || $attempt->started_at->lessThan($earliest) ? $attempt->started_at : $earliest;
                }
            }
        }

        if ($exerciseIds === [] || $earliest === null) {
            return [];
        }

        $submissions = Submission::query()
            ->whereIn('user_id', $userIds)
            ->whereIn('exercise_id', $exerciseIds)
            ->whereIn('status', ['passed', 'failed'])
            ->where('created_at', '>=', $earliest)
            ->get(['id', 'user_id', 'exercise_id', 'language', 'score', 'max_score', 'results', 'subtasks', 'created_at']);

        $best = [];

        foreach ($attempts as $attempt) {
            $end = $this->clock->windowEnd($attempt);

            foreach ($attempt->exam->parts as $part) {
                if ($part->exercise === null || ! $part->exercise->kind->isEditorBased()) {
                    continue;
                }

                $found = $this->scorer->bestOf($submissions->filter(
                    static fn (Submission $submission): bool => $submission->user_id === $attempt->user_id
                        && $submission->exercise_id === $part->exercise_id
                        && $submission->created_at->greaterThanOrEqualTo($attempt->started_at)
                        && $submission->created_at->lessThanOrEqualTo($end),
                ));

                if ($found !== null) {
                    $best[$attempt->id][$part->id] = $found;
                }
            }
        }

        return $best;
    }

    /**
     * @param  EloquentCollection<int, ExamAttempt>  $attempts
     * @return array<int, array<int, FileSubmission>> probalkozas azonosito => resz azonosito => feltoltes
     */
    private function uploads(EloquentCollection $attempts): array
    {
        $rows = FileSubmission::query()
            ->whereIn('exam_attempt_id', $attempts->modelKeys())
            ->get(['id', 'exam_attempt_id', 'exam_part_id', 'original_name', 'created_at']);

        $byAttempt = [];

        foreach ($rows as $row) {
            if ($row->exam_attempt_id !== null && $row->exam_part_id !== null) {
                $byAttempt[$row->exam_attempt_id][$row->exam_part_id] = $row;
            }
        }

        return $byAttempt;
    }

    private function editorFileName(Submission $submission): string
    {
        return 'megoldas.'.(self::EDITOR_FILE_EXTENSION[$submission->language] ?? 'txt');
    }
}
