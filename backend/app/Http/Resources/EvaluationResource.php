<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Services\Execution\EvaluationResult;
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
            'results' => $this->resource->results,
        ];
    }
}
