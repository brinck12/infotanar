<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\EmailVerificationController;
use App\Http\Controllers\Api\V1\HealthController;
use App\Http\Controllers\Api\V1\RunController;
use App\Http\Controllers\Api\V1\SubmissionController;
use App\Http\Controllers\Api\V1\TaskController;
use App\Http\Controllers\Api\V1\TopicController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    Route::get('/health', HealthController::class);

    Route::post('/auth/register', [AuthController::class, 'register']);
    Route::get('/auth/verify-email/{id}/{hash}', [EmailVerificationController::class, 'verify'])
        ->whereNumber('id')
        ->middleware('signed:relative')
        ->name('api.verification.verify');
    Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:login');

    Route::middleware('auth:sanctum')->group(function (): void {
        Route::get('/auth/me', [AuthController::class, 'me']);
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::post('/auth/email/verification-notification', [EmailVerificationController::class, 'resend'])
            ->middleware('throttle:verification-resend');
    });

    Route::get('/topics', [TopicController::class, 'index']);
    Route::get('/tasks', [TaskController::class, 'index']);
    Route::get('/tasks/{task}', [TaskController::class, 'show']);

    // A kodfuttatas draga muvelet: IP-nkent 10 keres / perc.
    Route::middleware('throttle:10,1')->group(function (): void {
        Route::post('/run', RunController::class);
        Route::post('/submissions', [SubmissionController::class, 'store']);
    });
});
