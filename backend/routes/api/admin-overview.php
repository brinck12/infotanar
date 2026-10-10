<?php

declare(strict_types=1);

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
