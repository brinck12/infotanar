<?php

declare(strict_types=1);

namespace App\Http\Resources\Admin;

use App\Services\Execution\Comparison\Comparison;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @property Comparison $resource */
final class ComparisonCheckResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'matches' => $this->resource->matches,
            'difference' => $this->resource->difference,
        ];
    }
}
