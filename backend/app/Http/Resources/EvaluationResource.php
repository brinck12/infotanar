<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Services\Execution\EvaluationResult;
use App\Services\Execution\Subtasks\SubtaskScore;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * A futtatas valasza nincs "data" boritekban: a frontend es a tesztek
 * ezt a lapos alakot hasznaljak a prototipus ota.
 *
 * @property EvaluationResult $resource
 */
final class EvaluationResource extends JsonResource
{
    /** @var string|null */
    public static $wrap = null;

    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'status' => $this->resource->status,
            'verdict' => $this->resource->verdict->value,
            'verdict_label' => $this->resource->verdict->label(),
            'violations' => $this->when($this->resource->violations !== [], $this->resource->violations),
            'message' => $this->when($this->resource->violations !== [], implode(' ', $this->resource->violations)),
            'results' => $this->resource->results,
            // Csak reszfeladatonkent pontozott feladatnal: minden mas valasz alakja valtozatlan.
            'subtasks' => $this->when($this->resource->subtasks !== null, fn (): array => SubtaskScore::listToArray($this->resource->subtasks ?? [])),
        ];
    }
}
