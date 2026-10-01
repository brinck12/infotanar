<?php

declare(strict_types=1);

namespace App\Http\Resources\Admin;

use App\Models\ExerciseFile;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Az admin minden fajlt latja, a tesztesethez kotottakat is. A tartalom nem
 * kerul a listaba: nagy lehet, es a szerkeszteshez nem kell.
 *
 * @mixin ExerciseFile
 */
final class AdminExerciseFileResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'exercise_id' => $this->exercise_id,
            'test_case_id' => $this->test_case_id,
            'name' => $this->name,
            'size' => $this->size,
            'sha256' => $this->sha256,
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
