<?php

declare(strict_types=1);

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Az admin attekintes mutatoi (BuildDashboardMetrics): a szerkezetet az action allitja ossze,
 * a resource csak a "data" boritekot adja.
 *
 * @property array<string, mixed> $resource
 */
final class DashboardMetricsResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return $this->resource;
    }
}
