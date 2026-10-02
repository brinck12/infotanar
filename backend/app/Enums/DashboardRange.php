<?php

declare(strict_types=1);

namespace App\Enums;

/** Az admin attekintes idoszaka (#160): az utolso 7, 30 vagy 90 naptari nap, a mai napot is beleertve. */
enum DashboardRange: string
{
    case Week = '7d';
    case Month = '30d';
    case Quarter = '90d';

    public function days(): int
    {
        return match ($this) {
            self::Week => 7,
            self::Month => 30,
            self::Quarter => 90,
        };
    }
}
