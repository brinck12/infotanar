<?php

declare(strict_types=1);

namespace App\Providers;

use App\Jobs\Concerns\AlertsOperatorOnFailure;
use App\Mail\OutboxTransport;
use App\Models\Attachment;
use App\Models\Exam;
use App\Models\ExamAttempt;
use App\Models\ExamPart;
use App\Models\Exercise;
use App\Models\FileSubmission;
use App\Models\Invoice;
use App\Models\Lesson;
use App\Models\Module;
use App\Models\RubricItem;
use App\Models\Subscription;
use App\Models\TestCase;
use App\Models\Track;
use App\Models\User;
use App\Services\Exams\ExamResultRecalculator;
use App\Services\Exams\NullExamResultRecalculator;
use App\Services\FileTasks\CheckRegistry;
use App\Support\Alerts\OperatorAlert;
use App\Support\RateLimiting\ExecutionRateLimit;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Contracts\Foundation\Application;
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
    /**
     * A vizsgaeredmenyt ujraszamolo Action, amelyet a vizsgak csomagja hoz
     * letre. Szovegkent all itt, mert addig nem letezik; amint letezik (es
     * megvalositja az ExamResultRecalculator interfeszt), a kotes ra valt.
     */
    private const EXAM_RESULT_RECALCULATOR = 'App\\Actions\\Exams\\RecomputeExamResult';

    public function register(): void
    {
        // Az olvasok es vizsgalat-kezelok jegyzeke kerelmenkent egyszer epul fel.
        $this->app->singleton(CheckRegistry::class);

        $this->app->bind(ExamResultRecalculator::class, static function (Application $app): ExamResultRecalculator {
            $recalculator = class_exists(self::EXAM_RESULT_RECALCULATOR) ? $app->make(self::EXAM_RESULT_RECALCULATOR) : null;

            return $recalculator instanceof ExamResultRecalculator ? $recalculator : new NullExamResultRecalculator;
        });
    }

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
            'exam' => Exam::class,
            'exam_part' => ExamPart::class,
            'exam_attempt' => ExamAttempt::class,
            'rubric_item' => RubricItem::class,
            'attachment' => Attachment::class,
            'file_submission' => FileSubmission::class,
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

        // Vizsga inditasa, reszfajl feltoltese, beadas: fiokonkent.
        RateLimiter::for('exam-write', static fn (Request $request) => Limit::perMinute(Config::integer('exams.rate.write_per_minute'))
            ->by($userOrIp($request))
            ->response($tooMany));

        // Fajlbeadas: minden feltoltes szinkron ertekeles, ezert percenkent es naponta is korlatos, fiokonkent.
        RateLimiter::for('file-submission', static fn (Request $request): array => [
            Limit::perMinute(Config::integer('filetasks.rate.per_minute'))
                ->by('file-submission:minute:'.$userOrIp($request))
                ->response($tooMany),
            Limit::perDay(Config::integer('filetasks.rate.per_day'))
                ->by('file-submission:day:'.$userOrIp($request))
                ->response($tooMany),
        ]);

        // Admin fajlfeltoltesek (csatolmany, forras-zip, ertekelolap-proba): adminonkent.
        RateLimiter::for('admin-upload', static fn (Request $request) => Limit::perMinute(Config::integer('filetasks.rate.admin_upload_per_minute'))
            ->by($userOrIp($request))
            ->response($tooMany));

        // Jelszot ellenorzo, visszafordithatatlan muveletek: a jelszo ne legyen talalgathato.
        RateLimiter::for('sensitive', static fn (Request $request) => Limit::perMinute(5)
            ->by($userOrIp($request))
            ->response($tooMany));
    }
}
