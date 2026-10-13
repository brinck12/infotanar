<?php

declare(strict_types=1);

namespace App\Http\Resources\Exams;

use App\Models\ExamAttempt;
use App\Services\Exams\AttemptProgress;
use App\Services\Exams\PartScore;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Az értékelt próbálkozás eredménye (frontend `ExamResult`): vizsgapontok
 * (átváltva, lefelé kerekítve) részenként, a még nem jelölt kézi pontok és az
 * ismétlési javaslatok. Jegy nincs: a pontok határai nem ellenőrzöttek.
 *
 * @mixin ExamAttempt
 */
final class ExamResultResource extends JsonResource
{
    /**
     * @param  list<PartScore>  $scores
     * @param  list<array{lesson_id: int, title: string, track: string}>  $review
     */
    public function __construct(
        private readonly AttemptProgress $progress,
        private readonly array $scores,
        private readonly array $review,
    ) {
        parent::__construct($progress->attempt);
    }

    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $attempt = $this->progress->attempt;

        return [
            'attempt_id' => $attempt->id,
            'exam' => ExamSummaryResource::make($attempt->exam, $this->progress),
            'score' => $attempt->score ?? 0,
            'max_score' => $attempt->max_score ?? 0,
            'pending_manual_points' => $attempt->pending_manual_points,
            'parts' => array_map(static fn (PartScore $score): array => [
                'part_id' => $score->partId,
                'score' => $score->score,
                'max_score' => $score->maxScore,
                'summary' => $score->summary,
                'file_submission_id' => $score->fileSubmissionId,
            ], $this->scores),
            'review' => $this->review,
        ];
    }
}
