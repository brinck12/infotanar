<?php

declare(strict_types=1);

namespace App\Services\Health;

use Illuminate\Support\Facades\Cache;

/**
 * Eletjel a hatterfolyamatoktol (#130). Az utemezo percenkent jelez, es
 * ugyanakkor sorba tesz egy jobot, amellyel a queue worker jelez. Ha
 * barmelyik leall, az eletjele megoregszik, es a readiness pirosra valt.
 * A cache kozos tarolo (adatbazis), ezert a webes folyamat is latja.
 */
final class Heartbeat
{
    public const SCHEDULER = 'health.heartbeat.scheduler';

    public const QUEUE_WORKER = 'health.heartbeat.queue_worker';

    public static function beat(string $key): void
    {
        Cache::forever($key, now()->getTimestamp());
    }

    /** Hany masodperce erkezett az utolso eletjel; null, ha meg soha. */
    public static function secondsSince(string $key): ?int
    {
        $last = Cache::get($key);

        return is_int($last) ? max(0, now()->getTimestamp() - $last) : null;
    }
}
