<?php

declare(strict_types=1);

namespace App\Services\Execution;

/**
 * Egy futtatasra ervenyes ido- es memoriakorlat (#151).
 *
 * Az ertekeket az ExecutionLimitResolver szamolja ki (feladat, nyelv, globalis
 * alapertek); a Judge0Service ezt kuldi el, a kliens ezt latja.
 */
final readonly class ExecutionLimits
{
    /** A feladatonkent megadhato ertekek hatarai (ExerciseRequest). */
    public const MIN_TIME_LIMIT_MS = 100;

    public const MAX_TIME_LIMIT_MS = 10_000;

    public const MIN_MEMORY_LIMIT_KB = 16_000;

    public const MAX_MEMORY_LIMIT_KB = 512_000;

    /**
     * @param  int  $timeLimitMs  Processzorido: ennyit szamolhat a program.
     * @param  int  $wallTimeLimitMs  Faliora-ido: ennyi telhet el osszesen (varakozassal, indulassal egyutt).
     * @param  int  $memoryLimitKb  Memoria kilobyte-ban.
     */
    public function __construct(
        public int $timeLimitMs,
        public int $wallTimeLimitMs,
        public int $memoryLimitKb,
    ) {}

    public function cpuTimeSeconds(): float
    {
        return $this->timeLimitMs / 1000;
    }

    public function wallTimeSeconds(): float
    {
        return $this->wallTimeLimitMs / 1000;
    }

    /**
     * A kliensnek szant alak. A faliora-korlat belso reszlet, nem megy ki.
     *
     * @return array{time_limit_ms: int, memory_limit_kb: int}
     */
    public function toArray(): array
    {
        return [
            'time_limit_ms' => $this->timeLimitMs,
            'memory_limit_kb' => $this->memoryLimitKb,
        ];
    }
}
