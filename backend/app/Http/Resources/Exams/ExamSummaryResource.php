<?php

declare(strict_types=1);

namespace App\Http\Resources\Exams;

use App\Models\Exam;
use App\Models\ExamPart;
use App\Services\Exams\AttemptProgress;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Egy vizsga a listaban és az eredmény mellett (frontend `ExamSummary`): a
 * részek szerkezete és a néző legutóbbi próbálkozása. Vendégnek és annak, aki
 * még nem kezdte, az `attempt` null.
 *
 * A hívónak be kell töltenie a `parts` kapcsolatot.
 *
 * @mixin Exam
 */
final class ExamSummaryResource extends JsonResource
{
    public function __construct(
        private readonly Exam $exam,
        private readonly ?AttemptProgress $progress = null,
    ) {
        parent::__construct($exam);
    }

    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            ...self::header($this->exam),
            'parts' => $this->exam->parts->map(static fn (ExamPart $part): array => self::partInfo($part))->all(),
            'attempt' => self::attemptPayload($this->exam, $this->progress),
        ];
    }

    /** @return array{id: int, session: string, title: string, level: string, minutes: int, points: int} */
    public static function header(Exam $exam): array
    {
        return [
            'id' => $exam->id,
            'session' => $exam->session,
            'title' => $exam->title,
            'level' => $exam->level,
            'minutes' => $exam->minutes,
            'points' => $exam->points,
        ];
    }

    /** @return array{id: int, order: int, key: string, name: string, points: int, minutes: int} */
    public static function partInfo(ExamPart $part): array
    {
        return [
            'id' => $part->id,
            'order' => $part->order(),
            'key' => $part->key->value,
            'name' => $part->name,
            'points' => $part->points,
            'minutes' => $part->minutes,
        ];
    }

    /**
     * A néző próbálkozása a lista alakjában. A `max_score` mindig a vizsga
     * részeinek összpontja, az értékelésig is.
     *
     * @return array{id: int, mode: string, state: string, score: int|null, max_score: int, completed_parts: list<int>}|null
     */
    public static function attemptPayload(Exam $exam, ?AttemptProgress $progress): ?array
    {
        if ($progress === null) {
            return null;
        }

        return [
            'id' => $progress->attempt->id,
            'mode' => $progress->attempt->mode->value,
            'state' => $progress->attempt->state->value,
            'score' => $progress->attempt->score,
            'max_score' => $exam->parts->reduce(static fn (int $carry, ExamPart $part): int => $carry + $part->points, 0),
            'completed_parts' => $progress->completedOrders(),
        ];
    }
}
