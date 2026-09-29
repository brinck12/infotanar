<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\HealthController;
use App\Http\Controllers\Api\V1\RunController;
use App\Http\Controllers\Api\V1\SubmissionController;
use App\Http\Controllers\Api\V1\TaskController;
use App\Http\Controllers\Api\V1\TopicController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    Route::get('/health', HealthController::class);

    Route::post('/auth/register', [AuthController::class, 'register']);

    Route::get('/topics', [TopicController::class, 'index']);
    Route::get('/tasks', [TaskController::class, 'index']);
    Route::get('/tasks/{task}', [TaskController::class, 'show']);

    // A kodfuttatas draga muvelet: IP-nkent 10 keres / perc.
    Route::middleware('throttle:10,1')->group(function (): void {
        Route::post('/run', RunController::class);
        Route::post('/submissions', [SubmissionController::class, 'store']);
    });
});
