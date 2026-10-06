<?php

declare(strict_types=1);

namespace App\Http\Resources\Catalog;

use App\Models\Exercise;
use App\Services\Progress\ExerciseStatuses;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Exercise */
final class ExerciseSummaryResource extends JsonResource
{
    public function __construct(Exercise $exercise, private readonly ExerciseStatuses $statuses)
    {
        parent::__construct($exercise);
    }

    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'level' => $this->level,
            'difficulty' => $this->difficulty,
            'allowed_languages' => $this->allowed_languages,
            // Csak bejelentkezett nezonel: "solved", "attempted", vagy null, ha meg nem adott be.
            'my_status' => $this->when($this->statuses->hasViewer(), fn (): ?string => $this->statuses->of($this->id)?->value),
        ];
    }
}
