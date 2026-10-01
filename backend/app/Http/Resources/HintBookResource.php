<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\ExerciseHint;
use App\Services\Learning\HintBook;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * A diak tippjei: az osszes tipp szama, es csak a megnyitottak szovege.
 * A `position` 1-tol szamol (hanyadik tipp), nem a tarolt sorszam.
 *
 * @property HintBook $resource
 */
final class HintBookResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'count' => $this->resource->total,
            'revealed' => $this->resource->revealed
                ->values()
                ->map(static fn (ExerciseHint $hint, int $index): array => ['position' => $index + 1, 'body' => $hint->body])
                ->all(),
        ];
    }
}
