<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\Admin\RegistrationGateController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Zart beta regisztracios kapu, admin oldal (LAUNCH-2)
|--------------------------------------------------------------------------
| A routes/api.php tolti be a `v1` csoporton belul; sajat (auth, admin) csoportot nyit.
*/

Route::prefix('admin')->name('admin.')->middleware(['auth:sanctum', 'admin'])->group(function (): void {
    Route::get('/registration', [RegistrationGateController::class, 'mode'])->name('registration.show');
    Route::put('/registration', [RegistrationGateController::class, 'updateMode'])->middleware('throttle:120,1')->name('registration.update');

    Route::get('/invite-codes', [RegistrationGateController::class, 'inviteCodes'])->name('invite-codes.index');
    Route::post('/invite-codes', [RegistrationGateController::class, 'createInviteCode'])->middleware('throttle:120,1')->name('invite-codes.store');
    Route::post('/invite-codes/{inviteCode}/disable', [RegistrationGateController::class, 'disableInviteCode'])
        ->whereNumber('inviteCode')->middleware('throttle:120,1')->name('invite-codes.disable');

    Route::get('/waitlist', [RegistrationGateController::class, 'waitlist'])->name('waitlist.index');
});
