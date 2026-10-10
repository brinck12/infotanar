<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\Learning\OralPracticeController;
use App\Http\Controllers\Api\V1\Learning\PreferencesController;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Tanulasi celok es szobeli gyakorlas (WP7)
|--------------------------------------------------------------------------
| A routes/api.php tolti be, a `v1` csoporton belul: az utvonalak a /api/v1
| elotagot, az `api.` nevelotagot es a RejectInvalidToken middleware-t
| oroklik.
|
| A korlatok harmadik parametere (pl. `throttle:60,1,oral-practice`) sajat
| szamlalot ad. Enelkul a nev nelkuli korlatok felhasznalonkent egyetlen
| kozos szamlalot novelnek, es a jegyzet gyakori mentese elfogyasztana a
| kodfuttatas (`throttle:10,1`) keretet.
*/

Route::middleware('auth:sanctum')->group(function (): void {
    Route::prefix('account/preferences')->name('account.preferences.')->group(function (): void {
        Route::get('/', [PreferencesController::class, 'show'])->name('show');
        Route::put('/', [PreferencesController::class, 'update'])->middleware('throttle:30,1,preferences')->name('update');
    });

    Route::prefix('oral/practice')->name('oral.practice.')->group(function (): void {
        Route::get('/', [OralPracticeController::class, 'index'])->name('index');

        // Csak a config/learning.php temakorei leteznek: barmi mas slug 404.
        Route::middleware('throttle:60,1,oral-practice')
            ->whereIn('topic', Config::array('learning.oral_topics'))
            ->group(function (): void {
                Route::put('/{topic}', [OralPracticeController::class, 'update'])->name('update');
                Route::post('/{topic}/attempts', [OralPracticeController::class, 'recordAttempt'])->name('attempts.store');
            });
    });
});
