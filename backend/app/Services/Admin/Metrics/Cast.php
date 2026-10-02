<?php

declare(strict_types=1);

namespace App\Services\Admin\Metrics;

/** Az adatbazis sorainak (stdClass, kevert tipusu mezok) biztonsagos tipusra alakitasa. */
final class Cast
{
    public static function int(mixed $value): int
    {
        return is_numeric($value) ? (int) $value : 0;
    }

    public static function string(mixed $value): string
    {
        return is_scalar($value) ? (string) $value : '';
    }
}
