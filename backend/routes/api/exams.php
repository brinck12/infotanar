<?php

declare(strict_types=1);

/*
|--------------------------------------------------------------------------
| Gyakorlo vizsgak (WP6)
|--------------------------------------------------------------------------
| A routes/api.php tolti be, a `v1` csoporton belul: az utvonalak a /api/v1
| elotagot, az `api.` nevelotagot es a RejectInvalidToken middleware-t
| oroklik. A fajl sajat csoportokat nyit, pl.:
|
|   Route::middleware('auth:sanctum')->group(...)
|   Route::prefix('admin')->name('admin.')->middleware(['auth:sanctum', 'admin'])->group(...)
|
| Ide tartozik: a diak vizsga-vegpontjai (/exams, /exams/{exam},
| /exams/{exam}/attempts, /exam-attempts/{attempt}...), az admin
| vizsgaszerkeszto (/admin/exams, /admin/exams/{exam}/parts,
| /admin/exam-parts/{part}) es a vizsga csatolmanyai
| (/admin/exams/{exam}/attachments).
|
| Elore definialt limiterek: `throttle:exam-write`, `throttle:admin-upload`.
*/
