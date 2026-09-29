<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\Account\AccountController;
use App\Http\Controllers\Api\V1\Admin\UserAccountController;
use App\Http\Controllers\Api\V1\Auth\CurrentUserController;
use App\Http\Controllers\Api\V1\Auth\EmailVerificationController;
use App\Http\Controllers\Api\V1\Auth\PasswordResetController;
use App\Http\Controllers\Api\V1\Auth\RegisterController;
use App\Http\Controllers\Api\V1\Auth\SessionController;
use App\Http\Controllers\Api\V1\Catalog\TaskController;
use App\Http\Controllers\Api\V1\Catalog\TopicController;
use App\Http\Controllers\Api\V1\Execution\RunController;
use App\Http\Controllers\Api\V1\Execution\SubmissionController;
use App\Http\Controllers\Api\V1\HealthController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->name('api.')->group(function (): void {
    Route::get('/health', HealthController::class)->name('health');

    Route::prefix('auth')->name('auth.')->group(function (): void {
        Route::post('/register', RegisterController::class)->name('register');
        Route::post('/login', [SessionController::class, 'store'])->middleware('throttle:login')->name('login');

        Route::get('/verify-email/{id}/{hash}', [EmailVerificationController::class, 'verify'])
            ->whereNumber('id')
            ->middleware('signed:relative')
            ->name('verification.verify');

        Route::middleware('throttle:password-reset')->group(function (): void {
            Route::post('/forgot-password', [PasswordResetController::class, 'forgot'])->name('password.forgot');
            Route::post('/reset-password', [PasswordResetController::class, 'reset'])->name('password.reset');
        });

        Route::middleware('auth:sanctum')->group(function (): void {
            Route::get('/me', CurrentUserController::class)->name('me');
            Route::post('/logout', [SessionController::class, 'destroy'])->name('logout');
            Route::post('/email/verification-notification', [EmailVerificationController::class, 'resend'])
                ->middleware('throttle:verification-resend')
                ->name('verification.resend');
        });
    });

    Route::get('/topics', [TopicController::class, 'index'])->name('topics.index');
    Route::get('/tasks', [TaskController::class, 'index'])->name('tasks.index');
    Route::get('/tasks/{task}', [TaskController::class, 'show'])->whereNumber('task')->name('tasks.show');

    // A kodfuttatas draga muvelet: IP-nkent 10 keres / perc.
    Route::middleware('throttle:10,1')->group(function (): void {
        Route::post('/run', RunController::class)->name('run');
        Route::post('/submissions', [SubmissionController::class, 'store'])->name('submissions.store');
    });

    Route::prefix('account')->name('account.')->middleware('auth:sanctum')->group(function (): void {
        Route::get('/export', [AccountController::class, 'export'])->middleware('throttle:account-export')->name('export');
        Route::delete('/', [AccountController::class, 'destroy'])->middleware('throttle:sensitive')->name('destroy');
    });

    Route::prefix('admin')->name('admin.')->middleware(['auth:sanctum', 'admin'])->group(function (): void {
        Route::get('/ping', static fn () => response()->json(['ok' => true]))->name('ping');

        Route::middleware('can:manageAccount,user')->group(function (): void {
            Route::get('/users/{user}/export', [UserAccountController::class, 'export'])->name('users.export');
            Route::delete('/users/{user}', [UserAccountController::class, 'destroy'])->name('users.destroy');
        });
    });
});
