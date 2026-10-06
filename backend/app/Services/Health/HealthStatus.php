<?php

declare(strict_types=1);

namespace App\Services\Health;

/**
 * Egy ellenorzes eredmenye (#130). A `Failed` azt jelenti, hogy az oldal egy
 * lenyeges resze nem mukodik (503); a `Degraded` figyelmeztetes, a kiszolgalas megy.
 */
enum HealthStatus: string
{
    case Ok = 'ok';
    case Degraded = 'degraded';
    case Failed = 'failed';

    /** A sulyosabb allapot a ketto kozul. */
    public function worseOf(self $other): self
    {
        return $this->severity() >= $other->severity() ? $this : $other;
    }

    private function severity(): int
    {
        return match ($this) {
            self::Ok => 0,
            self::Degraded => 1,
            self::Failed => 2,
        };
    }
}
