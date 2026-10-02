<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Actions\Admin\BuildDashboardMetrics;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\DashboardMetricsRequest;
use App\Http\Resources\Admin\DashboardMetricsResource;

/** Az admin kezdooldal szamai (#160). */
final class DashboardController extends Controller
{
    public function __invoke(DashboardMetricsRequest $request, BuildDashboardMetrics $metrics): DashboardMetricsResource
    {
        return DashboardMetricsResource::make($metrics->handle($request->range()));
    }
}
