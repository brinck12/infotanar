<?php

declare(strict_types=1);

namespace App\Http\Resources\Exams;

use App\Models\ExamAttempt;
use App\Services\Exams\AttemptProgress;
use App\Services\Exams\PartProgress;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Egy próbálkozás állapota (frontend `ExamAttempt`). A `server_time` a szerver
 * órája a válasz pillanatából: a kliens ehhez igazítja a visszaszámlálót, nem
 * a saját órája szerint számol.
 *
 * @mixin ExamAttempt
 */
final class ExamAttemptResource extends JsonResource
{
    public function __construct(
        private readonly AttemptProgress $progress,
        private readonly CarbonImmutable $serverTime,
    ) {
        parent::__construct($progress->attempt);
    }

    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $attempt = $this->progress->attempt;

        return [
            'id' => $attempt->id,
            'exam_id' => $attempt->exam_id,
            'mode' => $attempt->mode->value,
            'state' => $attempt->state->value,
            'started_at' => $attempt->started_at->toIso8601String(),
            'deadline' => $attempt->deadline_at?->toIso8601String(),
            'server_time' => $this->serverTime->toIso8601String(),
            'submissions' => array_map(static fn (PartProgress $part): array => [
                'part_id' => $part->partId,
                'file_name' => $part->fileName,
                'uploaded_at' => $part->uploadedAt->toIso8601String(),
            ], $this->progress->parts),
        ];
    }
}
