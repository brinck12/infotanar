<?php

declare(strict_types=1);

namespace App\Actions\Exams;

use App\Enums\ExamAttemptState;
use App\Enums\ExamMode;
use App\Exceptions\Access\PremiumContentLocked;
use App\Exceptions\Exams\ExamModeUnavailable;
use App\Models\Exam;
use App\Models\ExamAttempt;
use App\Models\User;
use App\Services\Exams\ExamAccess;
use Carbon\CarbonImmutable;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;

/**
 * Vizsgaprobalkozas inditasa. Idempotens: ha a diaknak van nyitott
 * probalkozasa ezen a vizsgan, azt adja vissza (a keresett modtol fuggetlenul),
 * igy a masodik lap vagy keszulek ugyanazt a feladatsort folytatja. Az uj
 * probalkozas `wasRecentlyCreated` jelzoje mondja meg a hivonak, hogy 201 vagy 200.
 *
 * A szerver hatarideje az egyetlen igazsag: vizsgahelyzetben a kezdestol szamitott
 * `minutes` perc.
 */
final readonly class StartExamAttempt
{
    public function __construct(
        private ExamAccess $access,
        private SubmitExamAttempt $submit,
    ) {}

    /**
     * @throws PremiumContentLocked ha a felhasznalo nem fer hozza a vizsgakhoz
     * @throws ExamModeUnavailable ha vizsgahelyzetet kert, de a vizsgan nincs idozitett mod
     */
    public function handle(User $user, Exam $exam, ExamMode $mode): ExamAttempt
    {
        $denial = $this->access->denialFor($user);

        if ($denial !== null) {
            throw new PremiumContentLocked($denial);
        }

        // A lejart nyitott probalkozas elobb lezarul (es ertekelodik), hogy helyet adjon az ujnak.
        $open = $this->openAttempt($user, $exam);

        if ($open !== null) {
            $this->submit->closeIfExpired($open);
        }

        try {
            return DB::transaction(function () use ($user, $exam, $mode): ExamAttempt {
                // A felhasznalo soranak zarolasa sorba allitja az egyszerre erkezo inditasokat.
                User::query()->whereKey($user->id)->lockForUpdate()->first();
                // A vizsga sora is zarolt: a reszt torlo admin ne fusson egybe az uj probalkozassal.
                Exam::query()->whereKey($exam->id)->lockForUpdate()->first();

                $existing = $this->openAttempt($user, $exam);

                if ($existing !== null) {
                    return $existing;
                }

                if ($mode->isTimed() && ! $exam->timed_mode) {
                    throw new ExamModeUnavailable;
                }

                $now = CarbonImmutable::now();

                return ExamAttempt::query()->create([
                    'user_id' => $user->id,
                    'exam_id' => $exam->id,
                    'mode' => $mode,
                    'state' => ExamAttemptState::InProgress,
                    'in_progress_marker' => true,
                    'started_at' => $now,
                    'deadline_at' => $mode->isTimed() ? $now->addMinutes($exam->minutes) : null,
                    'last_activity_at' => $now,
                ]);
            });
        } catch (UniqueConstraintViolationException $exception) {
            // Egyszerre erkezett ket inditas, es a masik nyert: az o nyitott probalkozasa az enyem is.
            return $this->openAttempt($user, $exam) ?? throw $exception;
        }
    }

    private function openAttempt(User $user, Exam $exam): ?ExamAttempt
    {
        return ExamAttempt::query()
            ->open()
            ->where('user_id', $user->id)
            ->where('exam_id', $exam->id)
            ->first();
    }
}
