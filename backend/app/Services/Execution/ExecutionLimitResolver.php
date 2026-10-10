<?php

declare(strict_types=1);

namespace App\Services\Execution;

use App\Models\Exercise;
use Illuminate\Support\Facades\Config;

/**
 * Melyik korlat ervenyes egy feladat adott nyelvu megoldasara (#151).
 *
 * Sorrend:
 *  1. a feladat sajat erteke (`time_limit_ms`, `memory_limit_kb`), ha meg van adva;
 *  2. kulonben a globalis alapertek (`judge0.limits`);
 *  3. az idot megszorozzuk a nyelv szorzojaval (`judge0.language_time_factor`),
 *     mert pl. a C# futtatokornyezete lassabban indul, mint a Pythone;
 *  4. az eredmeny nem lehet nagyobb, mint amit a Judge0 peldany elfogad
 *     (`max_cpu_time_limit`, `max_wall_time_limit`, `max_memory_limit`).
 */
final class ExecutionLimitResolver
{
    public function forExercise(Exercise $exercise, string $language): ExecutionLimits
    {
        return $this->resolve($exercise->time_limit_ms, $exercise->memory_limit_kb, $language);
    }

    /** A sajat korlat nelkuli feladatokra ervenyes ertekek. */
    public function defaultFor(string $language): ExecutionLimits
    {
        return $this->resolve(null, null, $language);
    }

    /**
     * Az engedelyezett nyelvekre ervenyes korlatok, a kliensnek szant alakban.
     *
     * @return array<string, array{time_limit_ms: int, memory_limit_kb: int}>
     */
    public function describe(Exercise $exercise): array
    {
        $limits = [];

        foreach ($exercise->allowed_languages ?? [] as $language) {
            $limits[$language] = $this->forExercise($exercise, $language)->toArray();
        }

        return $limits;
    }

    private function resolve(?int $timeLimitMs, ?int $memoryLimitKb, string $language): ExecutionLimits
    {
        $baseTimeMs = $timeLimitMs ?? self::toMs(Config::float('judge0.limits.cpu_time_limit'));
        $timeMs = min(
            (int) round($baseTimeMs * $this->timeFactor($language)),
            self::toMs(Config::float('judge0.limits.max_cpu_time_limit')),
        );

        // A faliora-korlat a processzoridonel bovebb: az indulas es a varakozas (I/O) is belefer.
        $wallTimeMs = min(
            $timeMs + self::toMs(Config::float('judge0.limits.wall_time_margin')),
            self::toMs(Config::float('judge0.limits.max_wall_time_limit')),
        );

        $memoryKb = min(
            $memoryLimitKb ?? Config::integer('judge0.limits.memory_limit'),
            Config::integer('judge0.limits.max_memory_limit'),
        );

        return new ExecutionLimits($timeMs, $wallTimeMs, $memoryKb);
    }

    /** Ennyivel szorozzuk az idokorlatot az adott nyelvnel; ismeretlen vagy hibas ertek = 1. */
    public function timeFactor(string $language): float
    {
        $factor = Config::get("judge0.language_time_factor.{$language}");

        return is_numeric($factor) && $factor > 0 ? (float) $factor : 1.0;
    }

    private static function toMs(float $seconds): int
    {
        return (int) round($seconds * 1000);
    }
}
