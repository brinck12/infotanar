<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\Account\AccountController;
use App\Http\Controllers\Api\V1\Account\ProfileController;
use App\Http\Controllers\Api\V1\Admin\AccessGrantController;
use App\Http\Controllers\Api\V1\Admin\Catalog\ConstraintOptionsController;
use App\Http\Controllers\Api\V1\Admin\Catalog\ExerciseController as AdminExerciseController;
use App\Http\Controllers\Api\V1\Admin\Catalog\LessonController as AdminLessonController;
use App\Http\Controllers\Api\V1\Admin\Catalog\ModuleController as AdminModuleController;
use App\Http\Controllers\Api\V1\Admin\Catalog\ReorderController;
use App\Http\Controllers\Api\V1\Admin\Catalog\TestCaseController;
use App\Http\Controllers\Api\V1\Admin\Catalog\TrackController as AdminTrackController;
use App\Http\Controllers\Api\V1\Admin\InvoiceController as AdminInvoiceController;
use App\Http\Controllers\Api\V1\Admin\UserAccountController;
use App\Http\Controllers\Api\V1\Admin\UserController as AdminUserController;
use App\Http\Controllers\Api\V1\Auth\CurrentUserController;
use App\Http\Controllers\Api\V1\Auth\EmailVerificationController;
use App\Http\Controllers\Api\V1\Auth\PasswordResetController;
use App\Http\Controllers\Api\V1\Auth\RegisterController;
use App\Http\Controllers\Api\V1\Auth\SessionController;
use App\Http\Controllers\Api\V1\Billing\BarionCallbackController;
use App\Http\Controllers\Api\V1\Billing\BillingProfileController;
use App\Http\Controllers\Api\V1\Billing\CheckoutController;
use App\Http\Controllers\Api\V1\Billing\PaymentController;
use App\Http\Controllers\Api\V1\Billing\PlanController;
use App\Http\Controllers\Api\V1\Billing\SubscriptionController;
use App\Http\Controllers\Api\V1\Catalog\LanguageController;
use App\Http\Controllers\Api\V1\Catalog\LessonController;
use App\Http\Controllers\Api\V1\Catalog\LessonVideoController;
use App\Http\Controllers\Api\V1\Catalog\TaskController;
use App\Http\Controllers\Api\V1\Catalog\TopicController;
use App\Http\Controllers\Api\V1\Catalog\TrackController;
use App\Http\Controllers\Api\V1\ClientErrorController;
use App\Http\Controllers\Api\V1\Execution\RunController;
use App\Http\Controllers\Api\V1\Execution\SubmissionController;
use App\Http\Controllers\Api\V1\HealthController;
use App\Http\Controllers\Api\V1\Progress\LessonCompletionController;
use App\Http\Controllers\Api\V1\Progress\ProgressController;
use App\Http\Controllers\Api\V1\ReadinessController;
use App\Http\Middleware\RejectInvalidToken;
use Illuminate\Support\Facades\Route;

// Minden vegpontra: a kuldott, de mar ervenytelen token 401, akkor is, ha a
// vegpont vendegkent is hivhato (kulonben a lejart munkamenet csendben vendegge valna, #136).
Route::prefix('v1')->name('api.')->middleware(RejectInvalidToken::class)->group(function (): void {
    Route::get('/health', HealthController::class)->name('health');
    Route::get('/health/ready', ReadinessController::class)->middleware('throttle:30,1')->name('health.ready');

    // A frontend nem kezelt hibainak bejelentese (#131); szuk limit, mert barki hivhatja.
    Route::post('/client-errors', ClientErrorController::class)->middleware('throttle:10,1')->name('client-errors');

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

    Route::get('/languages', [LanguageController::class, 'index'])->name('languages.index');
    Route::get('/tracks', [TrackController::class, 'index'])->name('tracks.index');
    Route::get('/tracks/{slug}', [TrackController::class, 'show'])->name('tracks.show');
    Route::get('/tracks/{trackSlug}/lessons/{lessonSlug}', [LessonController::class, 'show'])->name('tracks.lessons.show');

    Route::get('/lessons/{lesson}/video', [LessonVideoController::class, 'show'])
        ->whereNumber('lesson')
        ->name('lessons.video');
    Route::get('/lessons/{lesson}/video/stream', [LessonVideoController::class, 'stream'])
        ->whereNumber('lesson')
        ->middleware('signed:relative')
        ->name('lessons.video.stream');
    Route::get('/lessons/{lesson}/video/captions', [LessonVideoController::class, 'captions'])
        ->whereNumber('lesson')
        ->middleware('signed:relative')
        ->name('lessons.video.captions');

    Route::get('/topics', [TopicController::class, 'index'])->name('topics.index');
    Route::get('/tasks', [TaskController::class, 'index'])->name('tasks.index');
    Route::get('/tasks/{task}', [TaskController::class, 'show'])->whereNumber('task')->name('tasks.show');

    // A kodfuttatas draga muvelet: IP-nkent 10 keres / perc.
    Route::middleware('throttle:10,1')->group(function (): void {
        Route::post('/run', RunController::class)->name('run');
        Route::post('/submissions', [SubmissionController::class, 'store'])->name('submissions.store');
    });

    Route::get('/progress', ProgressController::class)->middleware('auth:sanctum')->name('progress');
    // Feladat nelkuli lecke kesznek jelolese (#144); a feladatos lecke beadassal teljesul.
    Route::post('/lessons/{lesson}/complete', [LessonCompletionController::class, 'store'])
        ->whereNumber('lesson')
        ->middleware(['auth:sanctum', 'throttle:30,1'])
        ->name('lessons.complete');

    Route::prefix('account')->name('account.')->middleware('auth:sanctum')->group(function (): void {
        Route::get('/export', [AccountController::class, 'export'])->middleware('throttle:account-export')->name('export');
        Route::delete('/', [AccountController::class, 'destroy'])->middleware('throttle:sensitive')->name('destroy');

        // Sajat adatok modositasa (#135). A jelszot kero muveletek a talalgatas ellen szuk limitet kapnak.
        Route::patch('/profile', [ProfileController::class, 'update'])->middleware('throttle:10,1')->name('profile.update');
        Route::put('/password', [ProfileController::class, 'changePassword'])->middleware('throttle:sensitive')->name('password.update');
        Route::post('/email', [ProfileController::class, 'requestEmailChange'])->middleware('throttle:sensitive')->name('email.request');
    });

    // Az uj e-mail-cimre kuldott link: bejelentkezes nelkul is megnyithato, az alairas vedi.
    Route::get('/account/email/confirm/{id}/{hash}', [ProfileController::class, 'confirmEmailChange'])
        ->whereNumber('id')
        ->middleware('signed:relative')
        ->name('account.email.confirm');

    Route::get('/billing/plan', PlanController::class)->name('billing.plan');

    // Elofizetes (#14): Barion fizetooldal inditasa es a fizetes allapota;
    // onkiszolgalo kezeles (#17): lemondas/visszavonas, kartyacsere, tortenet.
    Route::prefix('billing')->name('billing.')->middleware('auth:sanctum')->group(function (): void {
        Route::get('/profile', [BillingProfileController::class, 'show'])->name('profile.show');
        Route::put('/profile', [BillingProfileController::class, 'update'])->middleware('throttle:10,1')->name('profile.update');
        Route::post('/checkout', CheckoutController::class)->middleware('throttle:checkout')->name('checkout');
        Route::get('/payments', [PaymentController::class, 'index'])->name('payments.index');
        Route::get('/payments/{payment}', [PaymentController::class, 'show'])->whereUuid('payment')->name('payments.show');
        Route::get('/payments/{payment}/invoice', [PaymentController::class, 'invoice'])
            ->whereUuid('payment')
            ->middleware('throttle:30,1')
            ->name('payments.invoice');

        Route::prefix('subscription')->name('subscription.')->group(function (): void {
            Route::get('/', [SubscriptionController::class, 'show'])->name('show');
            Route::post('/cancel', [SubscriptionController::class, 'cancel'])->middleware('throttle:sensitive')->name('cancel');
            Route::post('/resume', [SubscriptionController::class, 'resume'])->middleware('throttle:sensitive')->name('resume');
            Route::post('/card', [SubscriptionController::class, 'changeCard'])->middleware('throttle:checkout')->name('card');
        });
    });

    // A Barion szerverrol szerverre hiv; nincs alairas, ezert a hivas csak
    // jelzes, az allapotot mindig a Barion API-bol kerdezzuk le (ADR 0001).
    Route::post('/webhooks/barion', BarionCallbackController::class)->middleware('throttle:60,1')->name('webhooks.barion');

    Route::prefix('admin')->name('admin.')->middleware(['auth:sanctum', 'admin'])->group(function (): void {
        Route::get('/ping', static fn () => response()->json(['ok' => true]))->name('ping');

        // Katalogus-szerkesztes (#45). A sorrend-vegpontok a szulo osszes gyereket varjak.
        Route::put('/tracks/order', [ReorderController::class, 'tracks'])->name('tracks.order');
        Route::put('/tracks/{track}/modules/order', [ReorderController::class, 'modules'])->name('modules.order');
        Route::put('/modules/{module}/lessons/order', [ReorderController::class, 'lessons'])->name('lessons.order');
        Route::put('/lessons/{lesson}/exercises/order', [ReorderController::class, 'exercises'])->name('exercises.order');

        Route::apiResource('tracks', AdminTrackController::class);
        Route::apiResource('modules', AdminModuleController::class);
        Route::apiResource('lessons', AdminLessonController::class);
        Route::apiResource('exercises', AdminExerciseController::class);

        Route::get('/constraint-options', ConstraintOptionsController::class)->name('constraint-options');

        // Felhasznalok attekintese (#50), csak olvasas.
        Route::get('/users', [AdminUserController::class, 'index'])->name('users.index');
        Route::get('/users/{user}', [AdminUserController::class, 'show'])->whereNumber('user')->name('users.show');

        // Kezi premium hozzaferes (#51): kiadas, tortenet, visszavonas.
        Route::get('/users/{user}/access-grants', [AccessGrantController::class, 'index'])->name('access-grants.index');
        Route::post('/users/{user}/access-grants', [AccessGrantController::class, 'store'])->name('access-grants.store');
        Route::delete('/access-grants/{accessGrant}', [AccessGrantController::class, 'destroy'])->name('access-grants.destroy');

        // Tesztesetek (#46): letrehozas/lista a feladat alatt, a tobbi kozvetlenul.
        Route::put('/exercises/{exercise}/test-cases/order', [TestCaseController::class, 'reorder'])->name('test-cases.order');
        Route::apiResource('exercises.test-cases', TestCaseController::class)->shallow()->parameters(['test-cases' => 'testCase']);

        // Elakadt szamlak (#103).
        Route::get('/invoices', [AdminInvoiceController::class, 'index'])->name('invoices.index');
        Route::put('/invoices/{invoice}/buyer', [AdminInvoiceController::class, 'updateBuyer'])->name('invoices.buyer');
        Route::post('/invoices/{invoice}/retry', [AdminInvoiceController::class, 'retry'])->name('invoices.retry');

        Route::middleware('can:manageAccount,user')->group(function (): void {
            Route::get('/users/{user}/export', [UserAccountController::class, 'export'])->name('users.export');
            Route::delete('/users/{user}', [UserAccountController::class, 'destroy'])->name('users.destroy');
        });
    });
});
