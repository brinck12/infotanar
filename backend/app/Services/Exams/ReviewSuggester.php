<?php

declare(strict_types=1);

namespace App\Services\Exams;

use App\Models\ExamAttempt;
use App\Models\ExamPart;
use App\Models\Lesson;

/**
 * Ismetlesi javaslatok az eredmenyoldalra (BACKEND.md 8.7, heurisztika): azokhoz
 * a reszekhez, ahol pont veszett el (a legtobb veszteseggel kezdve), annak a
 * feladatnak a modulbeli, a feladat leckeje ele eso, publikalt leckei, a
 * legkozelebbivel kezdve; osszesen legfeljebb 3.
 */
final class ReviewSuggester
{
    private const LIMIT = 3;

    /**
     * @param  ExamAttempt  $attempt  az `exam.parts.exercise.lesson.module.track` betoltve
     * @param  list<PartScore>  $scores
     * @return list<array{lesson_id: int, title: string, track: string}>
     */
    public function suggest(ExamAttempt $attempt, array $scores): array
    {
        $parts = $attempt->exam->parts->keyBy('id');
        $lossy = array_values(array_filter($scores, static fn (PartScore $score): bool => $score->score < $score->maxScore));
        usort($lossy, static fn (PartScore $a, PartScore $b): int => ($b->maxScore - $b->score) <=> ($a->maxScore - $a->score));

        $suggestions = [];

        foreach ($lossy as $score) {
            $part = $parts->get($score->partId);

            if (! $part instanceof ExamPart || $part->exercise === null) {
                continue;
            }

            $lesson = $part->exercise->lesson;
            $track = $lesson->module->track;

            $earlier = Lesson::query()
                ->published()
                ->where('module_id', $lesson->module_id)
                ->where('position', '<', $lesson->position)
                ->orderByDesc('position')
                ->limit(self::LIMIT)
                ->get(['id', 'title']);

            foreach ($earlier as $candidate) {
                if (count($suggestions) >= self::LIMIT) {
                    break 2;
                }

                $suggestions[$candidate->id] ??= ['lesson_id' => $candidate->id, 'title' => $candidate->title, 'track' => $track->title];
            }
        }

        return array_values($suggestions);
    }
}
