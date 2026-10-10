<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\Catalog\AttachmentDownloadController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Tipusos feladatok es csatolmanyok (WP1)
|--------------------------------------------------------------------------
| A routes/api.php tolti be, a `v1` csoporton belul: az utvonalak a /api/v1
| elotagot, az `api.` nevelotagot es a RejectInvalidToken middleware-t
| oroklik. A fajl sajat csoportokat nyit, pl.:
|
|   Route::prefix('admin')->name('admin.')->middleware(['auth:sanctum', 'admin'])->group(...)
|
| Ide tartozik: a feladat csatolmanyainak admin vegpontjai
| (/admin/exercises/{exercise}/attachments, /admin/attachments/{attachment}).
*/

// Csatolt fajl letoltese alairt URL-lel. A nevet (api.attachments.download) az
// AttachmentUrls::ROUTE hasznalja: minden URL-t kiado eroforras ezen all.
Route::get('/attachments/{attachment}/download', AttachmentDownloadController::class)
    ->whereNumber('attachment')
    ->middleware('signed:relative')
    ->name('attachments.download');
