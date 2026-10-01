<?php

declare(strict_types=1);

namespace App\Services\Health\Checks;

use App\Services\Health\CheckResult;
use App\Services\Health\HealthCheck;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;

/**
 * Mennyit var a legregebbi futtathato job, es hany job bukott el az utolso
 * napban. Csak az adatbazis-alapu sornal ertelmezett (elesben ez fut).
 */
final class QueueBacklogCheck implements HealthCheck
{
    public function name(): string
    {
        return 'queue_backlog';
    }

    public function run(): CheckResult
    {
        if (Config::string('queue.default') !== 'database') {
            return CheckResult::ok('Nem adatbázis-sor: a várakozás nem mérhető.');
        }

        $waiting = $this->oldestWaitSeconds();
        $recentlyFailed = DB::table(Config::string('queue.failed.table'))
            ->where('failed_at', '>=', now()->subDay())
            ->count();

        return match (true) {
            $waiting > Config::integer('health.queue_wait_fail_seconds') => CheckResult::failed("A legrégebbi job {$waiting} másodperce vár: a worker nem dolgozza fel a sort."),
            $waiting > Config::integer('health.queue_wait_warn_seconds') => CheckResult::degraded("A legrégebbi job {$waiting} másodperce vár."),
            $recentlyFailed > 0 => CheckResult::degraded("{$recentlyFailed} job bukott el az elmúlt 24 órában."),
            default => CheckResult::ok(),
        };
    }

    /** A kesleltetett (meg nem esedekes) es az eppen futo jobok nem szamitanak varakozonak. */
    private function oldestWaitSeconds(): int
    {
        $now = now()->getTimestamp();

        $oldest = DB::table(Config::string('queue.connections.database.table'))
            ->whereNull('reserved_at')
            ->where('available_at', '<=', $now)
            ->min('available_at');

        return is_numeric($oldest) ? $now - (int) $oldest : 0;
    }
}
