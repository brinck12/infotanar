<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Actions\Admin\BuildOverview;
use App\Http\Controllers\Controller;
use App\Http\Resources\Admin\OverviewResource;

/**
 * Az admin kezdooldal szamai es a legutobbi naplozott muveletek egyetlen
 * keresben, a korabbi hat lista-lekeres helyett. Csak olvas.
 */
final class OverviewController extends Controller
{
    public function __invoke(BuildOverview $build): OverviewResource
    {
        return new OverviewResource($build->handle());
    }
}
