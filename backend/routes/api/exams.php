<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\Admin\Exams\ExamAttachmentController;
use App\Http\Controllers\Api\V1\Admin\Exams\ExamController as AdminExamController;
use App\Http\Controllers\Api\V1\Admin\Exams\ExamPartController;
use App\Http\Controllers\Api\V1\Exams\ExamAttemptController;
use App\Http\Controllers\Api\V1\Exams\ExamController;
use App\Http\Controllers\Api\V1\Exams\ExamPartFileController;
use Illuminate\Support\Facades\Route;

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

// A lista nyilvanos (eladja a vizsgakat): a token nem kotelezo, a bejelentkezett a sajat probalkozasait is latja.
Route::get('/exams', [ExamController::class, 'index'])->name('exams.index');

Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('/exams/{exam}', [ExamController::class, 'show'])->whereNumber('exam')->name('exams.show');

    // Probalkozas inditasa, feltoltes, beadas: fiokonkent korlatozott iras.
    Route::post('/exams/{exam}/attempts', [ExamAttemptController::class, 'store'])
        ->whereNumber('exam')
        ->middleware('throttle:exam-write')
        ->name('exams.attempts.store');

    Route::get('/exam-attempts/{attempt}', [ExamAttemptController::class, 'show'])
        ->whereNumber('attempt')
        ->name('exam-attempts.show');

    Route::post('/exam-attempts/{attempt}/parts/{part}/file', [ExamPartFileController::class, 'store'])
        ->whereNumber(['attempt', 'part'])
        ->middleware('throttle:exam-write')
        ->name('exam-attempts.parts.file');

    Route::post('/exam-attempts/{attempt}/submit', [ExamAttemptController::class, 'submit'])
        ->whereNumber('attempt')
        ->middleware('throttle:exam-write')
        ->name('exam-attempts.submit');

    Route::get('/exam-attempts/{attempt}/result', [ExamAttemptController::class, 'result'])
        ->whereNumber('attempt')
        ->name('exam-attempts.result');
});

Route::prefix('admin')->name('admin.')->middleware(['auth:sanctum', 'admin'])->group(function (): void {
    Route::get('/exams', [AdminExamController::class, 'index'])->name('exams.index');
    Route::post('/exams', [AdminExamController::class, 'store'])->name('exams.store');
    Route::get('/exams/{exam}', [AdminExamController::class, 'show'])->whereNumber('exam')->name('exams.show');
    Route::put('/exams/{exam}', [AdminExamController::class, 'update'])->whereNumber('exam')->name('exams.update');

    // Reszek: a hozzaadas az egesz vizsgat adja vissza; a sorrend-vegpont az osszes reszt varja.
    Route::put('/exams/{exam}/parts/order', [ExamPartController::class, 'reorder'])->whereNumber('exam')->name('exams.parts.order');
    Route::post('/exams/{exam}/parts', [ExamPartController::class, 'store'])->whereNumber('exam')->name('exams.parts.store');
    Route::delete('/exam-parts/{part}', [ExamPartController::class, 'destroy'])->whereNumber('part')->name('exam-parts.destroy');

    // A forras-zip feltoltese; a torles a kozos DELETE /admin/attachments/{attachment} (typed-tasks.php).
    Route::post('/exams/{exam}/attachments', [ExamAttachmentController::class, 'store'])
        ->whereNumber('exam')
        ->middleware('throttle:admin-upload')
        ->name('exams.attachments.store');
});
