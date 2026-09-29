<?php

declare(strict_types=1);

namespace App\Providers;

use App\Mail\OutboxTransport;
use App\Models\User;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

final class AppServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        // Fejlesztes es teszt alatt hangos hiba: N+1 lekerdezes, elnyelt
        // mass-assignment, nem letezo attributum eleres.
        Model::shouldBeStrict(! $this->app->isProduction());

        Password::defaults(static fn () => Password::min(8)->letters()->numbers());

        Mail::extend('outbox', static fn () => new OutboxTransport(Config::string('mail.mailers.outbox.path')));

        $this->configureRateLimiting();
    }

    private function configureRateLimiting(): void
    {
        $tooMany = static fn (): JsonResponse => response()->json(['message' => __('auth.throttle')], 429);
        $emailAndIp = static fn (Request $request): string => $request->string('email')->lower()->append('|', (string) $request->ip())->toString();

        // Fiokonkent (e-mail + IP), hogy egy tamado ne zarhassa ki a tobbi felhasznalot.
        RateLimiter::for('login', static fn (Request $request) => Limit::perMinute(5)
            ->by($emailAndIp($request))
            ->response($tooMany));

        RateLimiter::for('password-reset', static fn (Request $request) => Limit::perMinute(5)
            ->by($emailAndIp($request))
            ->response($tooMany));

        RateLimiter::for('verification-resend', static fn (Request $request) => Limit::perMinute(3)
            ->by($request->user() instanceof User ? (string) $request->user()->id : (string) $request->ip())
            ->response($tooMany));
    }
}
