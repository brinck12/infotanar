<?php

declare(strict_types=1);

namespace App\Http\Resources\Admin;

use App\Models\RubricItem;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Az ertekelolap egy pontja a szerkesztonek: a frontend `RubricItem` tipusa
 * (frontend/src/features/admin/exams/api.ts), kiegeszitve a feladat
 * azonositojaval es a sorszammal. A `params` csak akkor megy ki, ha ki van toltve.
 *
 * @mixin RubricItem
 */
final class AdminRubricItemResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'exercise_id' => $this->exercise_id,
            'position' => $this->position,
            'label' => $this->label,
            'group' => $this->group,
            'check_type' => $this->check_type->value,
            'property' => $this->property,
            'expected' => $this->expected,
            'points' => $this->points,
            'mode' => $this->mode->value,
            'hint' => $this->hint,
            'params' => $this->when($this->params !== null, $this->params),
        ];
    }
}
