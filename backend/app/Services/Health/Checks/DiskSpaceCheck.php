<?php

declare(strict_types=1);

namespace App\Services\Health\Checks;

use App\Services\Health\CheckResult;
use App\Services\Health\HealthCheck;
use Illuminate\Support\Facades\Config;

/** A storage lemeze: ide kerulnek a szamlak, a videok, a naplok es a deploy elotti mentesek. */
final class DiskSpaceCheck implements HealthCheck
{
    public function name(): string
    {
        return 'disk';
    }

    public function run(): CheckResult
    {
        $path = storage_path();
        $free = disk_free_space($path);
        $total = disk_total_space($path);

        if ($free === false || $total === false || $total <= 0.0) {
            return CheckResult::degraded('A szabad lemezterület nem állapítható meg.');
        }

        $freePercent = (int) floor($free / $total * 100);
        $detail = "{$freePercent}% szabad.";

        return match (true) {
            $freePercent < Config::integer('health.disk_free_fail_percent') => CheckResult::failed($detail),
            $freePercent < Config::integer('health.disk_free_warn_percent') => CheckResult::degraded($detail),
            default => CheckResult::ok($detail),
        };
    }
}
