<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\Admin\Catalog\RubricCheckController;
use App\Http\Controllers\Api\V1\Admin\Catalog\RubricItemController;
use App\Http\Controllers\Api\V1\FileTasks\FileSubmissionController;
use Illuminate\Support\Facades\Route;

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

// Fajlbeadas: csak bejelentkezve (a feltoltes fiokhoz kotott; vendeg 401-et kap).
Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('/exercises/{exercise}/file-submissions', [FileSubmissionController::class, 'index'])
        ->whereNumber('exercise')
        ->name('exercises.file-submissions.index');

    // Minden feltoltes szinkron ertekeles: percenkent es naponta is korlatos, fiokonkent.
    Route::post('/exercises/{exercise}/file-submissions', [FileSubmissionController::class, 'store'])
        ->whereNumber('exercise')
        ->middleware('throttle:file-submission')
        ->name('exercises.file-submissions.store');

    Route::get('/file-submissions/{submission}', [FileSubmissionController::class, 'show'])
        ->whereNumber('submission')
        ->name('file-submissions.show');

    Route::put('/file-submissions/{submission}/manual', [FileSubmissionController::class, 'manual'])
        ->whereNumber('submission')
        ->middleware('throttle:30,1')
        ->name('file-submissions.manual');
});

// A feltoltott kep elonezete alairt URL-lel. A nevet (api.file-submissions.file)
// a FileSubmissionPresenter::PREVIEW_ROUTE hasznalja.
Route::get('/file-submissions/{submission}/file', [FileSubmissionController::class, 'file'])
    ->whereNumber('submission')
    ->middleware('signed:relative')
    ->name('file-submissions.file');

Route::prefix('admin')->name('admin.')->middleware(['auth:sanctum', 'admin'])->group(function (): void {
    // Ertekelolap: lista es letrehozas a feladat alatt, modositas es torles kozvetlenul.
    // A sorrend-vegpont a feladat osszes pontjat varja.
    Route::put('/exercises/{exercise}/rubric-items/order', [RubricItemController::class, 'reorder'])->name('rubric-items.order');
    Route::get('/exercises/{exercise}/rubric-items', [RubricItemController::class, 'index'])->name('rubric-items.index');
    Route::post('/exercises/{exercise}/rubric-items', [RubricItemController::class, 'store'])->name('rubric-items.store');
    Route::put('/rubric-items/{item}', [RubricItemController::class, 'update'])->name('rubric-items.update');
    Route::delete('/rubric-items/{item}', [RubricItemController::class, 'destroy'])->name('rubric-items.destroy');

    // Ertekelolap-proba egy feltoltott fajllal vagy a mintamegoldassal; nem tarol semmit.
    Route::post('/exercises/{exercise}/rubric-check', RubricCheckController::class)
        ->middleware('throttle:admin-upload')
        ->name('rubric-check');
});
