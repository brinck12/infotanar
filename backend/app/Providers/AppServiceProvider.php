<?php

namespace App\Providers;

use App\Mail\OutboxTransport;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Mail::extend('outbox', fn (array $config) => new OutboxTransport($config['path']));

        $tooMany = fn () => response()->json(['message' => 'Túl sok próbálkozás, próbáld újra később.'], 429);

        // Fiokonkent (e-mail + IP), hogy egy tamado ne zarhassa ki a tobbi felhasznalot.
        RateLimiter::for('login', fn (Request $request) => Limit::perMinute(5)
            ->by(mb_strtolower((string) $request->input('email')).'|'.$request->ip())
            ->response($tooMany));

        RateLimiter::for('verification-resend', fn (Request $request) => Limit::perMinute(3)
            ->by((string) $request->user()?->id)
            ->response($tooMany));
    }
}
