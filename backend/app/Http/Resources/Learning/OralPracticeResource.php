<?php

declare(strict_types=1);

namespace App\Http\Resources\Learning;

use App\Models\OralPractice;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Egy szobeli temakor gyakorlasi allapota: a frontend `OralPractice` tipusa,
 * kiegeszitve a temakor slugjaval es az utolso gyakorlas idejevel.
 *
 * @mixin OralPractice
 */
final class OralPracticeResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'topic' => $this->topic,
            'checked' => $this->checked,
            'notes' => (string) $this->notes,
            // Az ures onertekeles a modellbol ures tombkent jon vissza; a frontend
            // objektumot var (`{}`), nem listat (`[]`).
            'scores' => (object) $this->scores,
            'attempts' => $this->attempts,
            'last_practiced_at' => $this->last_practiced_at?->toIso8601String(),
        ];
    }
}
