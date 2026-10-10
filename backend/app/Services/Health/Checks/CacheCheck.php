<?php

declare(strict_types=1);

namespace App\Services\Health\Checks;

use App\Services\Health\CheckResult;
use App\Services\Health\HealthCheck;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

/** A rate limit, a job-zarak es az eletjelek mind a cache-re epulnek. */
final class CacheCheck implements HealthCheck
{
    private const KEY = 'health.cache_probe';

    public function name(): string
    {
        return 'cache';
    }

    public function run(): CheckResult
    {
        $written = Str::random(16);
        Cache::put(self::KEY, $written, 60);

        return Cache::get(self::KEY) === $written
            ? CheckResult::ok()
            : CheckResult::failed('A cache-be írt érték nem olvasható vissza.');
    }
}
