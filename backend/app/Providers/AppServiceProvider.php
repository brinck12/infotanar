<?php

declare(strict_types=1);

namespace App\Providers;

use App\Jobs\Concerns\AlertsOperatorOnFailure;
use App\Mail\OutboxTransport;
use App\Models\Exercise;
use App\Models\Invoice;
use App\Models\Lesson;
use App\Models\Module;
use App\Models\Subscription;
use App\Models\TestCase;
use App\Models\Track;
use App\Models\User;
use App\Support\Alerts\OperatorAlert;
use App\Support\RateLimiting\ExecutionRateLimit;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Queue\Events\JobFailed;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;
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

        // Polimorf kapcsolatokban (pl. audit naplo) stabil alias, ne az osztalynev keruljon az adatbazisba.
        Relation::enforceMorphMap([
            'user' => User::class,
            'track' => Track::class,
            'module' => Module::class,
            'lesson' => Lesson::class,
            'exercise' => Exercise::class,
            'test_case' => TestCase::class,
            'subscription' => Subscription::class,
            'invoice' => Invoice::class,
        ]);

        Password::defaults(static fn () => Password::min(8)->letters()->numbers());

        Mail::extend('outbox', static fn () => new OutboxTransport(Config::string('mail.mailers.outbox.path')));

        $this->configureRateLimiting();
        $this->alertOnFailedJobs();
    }

    /**
     * Minden vegleg elbukott jobrol riasztas megy (#131), pl. egy ki nem
     * kuldheto megerosito levelrol is. A sajat azonositoikkal riaszto jobok
     * (AlertsOperatorOnFailure) maguk jelentenek, azokat itt kihagyjuk.
     */
    private function alertOnFailedJobs(): void
    {
        Queue::failing(static function (JobFailed $event): void {
            $job = $event->job->resolveName();

            if (class_exists($job) && in_array(AlertsOperatorOnFailure::class, class_uses_recursive($job), true)) {
                return;
            }

            app(OperatorAlert::class)->raise(
                __('alerts.job_failed', ['job' => class_basename($job)]),
                ['error' => $event->exception->getMessage()],
            );
        });
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

        $userOrIp = static fn (Request $request): string => $request->user() instanceof User
            ? 'user:'.$request->user()->id
            : 'ip:'.$request->ip();

        RateLimiter::for('verification-resend', static fn (Request $request) => Limit::perMinute(3)
            ->by($userOrIp($request))
            ->response($tooMany));

        // A teljes adatexport draga lekerdezes: orankent nehany eleg barkinek.
        RateLimiter::for('account-export', static fn (Request $request) => Limit::perHour(5)
            ->by($userOrIp($request))
            ->response($tooMany));

        // Minden inditas egy Barion-hivas es egy fizetes-sor: ne lehessen vele elarasztani.
        RateLimiter::for('checkout', static fn (Request $request) => Limit::perMinute(5)
            ->by($userOrIp($request))
            ->response($tooMany));

        // Kodfuttatas: bejelentkezve fiokonkent, vendegnel IP-nkent, es egy kozos keret a Judge0 vedelmere.
        RateLimiter::for('execution', static fn (Request $request): array => app(ExecutionRateLimit::class)->limits($request));

        // Egy admin egy felhasznalonak kuldott levelei (megerosites, jelszo-visszaallitas): ne lehessen
        // vele elarasztani a cimzettet. Adminonkent es cimzettenkent szamol, a tobbi felhasznalo ne korlatozodjon.
        RateLimiter::for('admin-user-mail', static function (Request $request) use ($userOrIp, $tooMany) {
            $target = $request->route('user');

            return Limit::perMinute(3)
                ->by($userOrIp($request).'|target:'.($target instanceof User ? $target->id : (string) $target))
                ->response($tooMany);
        });

        // Jelszot ellenorzo, visszafordithatatlan muveletek: a jelszo ne legyen talalgathato.
        RateLimiter::for('sensitive', static fn (Request $request) => Limit::perMinute(5)
            ->by($userOrIp($request))
            ->response($tooMany));
    }
}
