<?php

declare(strict_types=1);

/*
|--------------------------------------------------------------------------
| Fajlbeadasok es ertekelolap (WP3)
|--------------------------------------------------------------------------
| A routes/api.php tolti be, a `v1` csoporton belul: az utvonalak a /api/v1
| elotagot, az `api.` nevelotagot es a RejectInvalidToken middleware-t
| oroklik. A fajl sajat csoportokat nyit, pl.:
|
|   Route::middleware('auth:sanctum')->group(...)
|   Route::prefix('admin')->name('admin.')->middleware(['auth:sanctum', 'admin'])->group(...)
|
| Ide tartozik: fajlbeadas es listaja (/exercises/{exercise}/file-submissions),
| egy beadas, a kezi pontok es az alairt elonezet (/file-submissions/{submission}...),
| az ertekelolap admin vegpontjai (/admin/exercises/{exercise}/rubric-items,
| /admin/rubric-items/{item}) es az ertekelolap-proba
| (/admin/exercises/{exercise}/rubric-check).
|
| Elore definialt limiterek: `throttle:file-submission`, `throttle:admin-upload`.
*/
