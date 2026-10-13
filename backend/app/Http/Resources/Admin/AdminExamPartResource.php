<?php

declare(strict_types=1);

namespace App\Http\Resources\Admin;

use App\Models\ExamPart;
use App\Services\Exams\PartReadiness;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Egy vizsgarész a szerkesztőnek (frontend `AdminExamPart`). A hívónak be kell
 * töltenie a `exercise` kapcsolatot a PartReadiness összesítéseivel.
 *
 * @mixin ExamPart
 */
final class AdminExamPartResource extends JsonResource
{
    public function __construct(private readonly ExamPart $part)
    {
        parent::__construct($part);
    }

    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $readiness = resolve(PartReadiness::class)->of($this->part);

        return [
            'id' => $this->id,
            'order' => $this->order(),
            'key' => $this->key->value,
            'name' => $this->name,
            'exercise_id' => $this->exercise_id,
            'exercise_title' => $this->exercise?->title,
            'points' => $this->points,
            'minutes' => $this->minutes,
            'rubric_status' => $readiness['status'],
            'missing_points' => $readiness['missing_points'],
        ];
    }
}
