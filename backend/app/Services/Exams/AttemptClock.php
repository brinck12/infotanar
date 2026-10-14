<?php

declare(strict_types=1);

namespace App\Services\Exams;

use App\Models\ExamAttempt;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Config;

/**
 * A vizsgaprobalkozas ideje: a hatarido egyetlen forrasa a szerver
 * (`deadline_at`), a kliens szamlaloja csak megjelenites.
 */
final class AttemptClock
{
    public function now(): CarbonImmutable
    {
        return CarbonImmutable::now();
    }

    /** A hatarido utani turelmi ido: ameddig feltoltest meg elfogadunk. */
    public function graceSeconds(): int
    {
        return max(0, Config::integer('exams.grace_seconds'));
    }

    /** A feltoltes utolso elfogadott pillanata; gyakorlasnal (nincs hatarido) null. */
    public function closesAt(ExamAttempt $attempt): ?CarbonImmutable
    {
        return $attempt->deadline_at === null
            ? null
            : CarbonImmutable::instance($attempt->deadline_at)->addSeconds($this->graceSeconds());
    }

    /** Lejart-e: vizsgahelyzetben a hatarido + turelmi ido elmult. */
    public function isExpired(ExamAttempt $attempt, ?CarbonImmutable $at = null): bool
    {
        $closesAt = $this->closesAt($attempt);

        return $closesAt !== null && ($at ?? $this->now())->greaterThan($closesAt);
    }

    /**
     * Eddig szamit egy kodbeadas az attempthez: nyitott probalkozasnal most,
     * beadottnal a beadas pillanata, de vizsgahelyzetben soha nem a
     * hatarido + turelmi ido utan.
     */
    public function windowEnd(ExamAttempt $attempt): CarbonImmutable
    {
        $end = $attempt->submitted_at === null ? $this->now() : CarbonImmutable::instance($attempt->submitted_at);
        $closesAt = $this->closesAt($attempt);

        return $closesAt !== null && $closesAt->lessThan($end) ? $closesAt : $end;
    }
}
