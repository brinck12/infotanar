<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\Admin\OverviewController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Admin attekinto (WP9)
|--------------------------------------------------------------------------
| A routes/api.php tolti be, a `v1` csoporton belul: az utvonalak a /api/v1
| elotagot, az `api.` nevelotagot es a RejectInvalidToken middleware-t
| oroklik. A fajl sajat csoportot nyit:
|
|   Route::prefix('admin')->name('admin.')->middleware(['auth:sanctum', 'admin'])->group(...)
|
| Ide tartozik: /admin/overview.
*/

Route::prefix('admin')->name('admin.')->middleware(['auth:sanctum', 'admin'])->group(function (): void {
    // Az admin kezdooldal szamai es a legutobbi naplozott muveletek, egy keresben.
    Route::get('/overview', OverviewController::class)->name('overview');
});
