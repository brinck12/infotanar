<?php

declare(strict_types=1);

namespace App\Services\Health;

use App\Services\Health\Checks\BackupFreshnessCheck;
use App\Services\Health\Checks\CacheCheck;
use App\Services\Health\Checks\DatabaseCheck;
use App\Services\Health\Checks\DiskSpaceCheck;
use App\Services\Health\Checks\HeartbeatCheck;
use App\Services\Health\Checks\Judge0Check;
use App\Services\Health\Checks\QueueBacklogCheck;
use Illuminate\Support\Facades\Config;
use Throwable;

/**
 * Az osszes fuggoseg ellenorzese egy valaszban (#130). Egy ellenorzes hibaja
 * (akar kivetel) nem akasztja meg a tobbit: pont akkor kell a teljes kep,
 * amikor valami nem mukodik.
 */
final readonly class ReadinessReport
{
    public function __construct(
        private DatabaseCheck $database,
        private CacheCheck $cache,
        private QueueBacklogCheck $queueBacklog,
        private Judge0Check $judge0,
        private DiskSpaceCheck $disk,
        private BackupFreshnessCheck $backup,
    ) {}

    /** @return array{status: HealthStatus, checks: list<array{name: string, status: string, detail: string|null}>} */
    public function build(): array
    {
        $overall = HealthStatus::Ok;
        $checks = [];

        foreach ($this->checks() as $check) {
            $result = $this->run($check);
            $overall = $overall->worseOf($result->status);
            $checks[] = ['name' => $check->name(), 'status' => $result->status->value, 'detail' => $result->detail];
        }

        return ['status' => $overall, 'checks' => $checks];
    }

    /** @return list<HealthCheck> */
    private function checks(): array
    {
        return [
            $this->database,
            $this->cache,
            new HeartbeatCheck('scheduler', Heartbeat::SCHEDULER, Config::integer('health.scheduler_max_age_seconds')),
            new HeartbeatCheck('queue_worker', Heartbeat::QUEUE_WORKER, Config::integer('health.queue_worker_max_age_seconds')),
            $this->queueBacklog,
            $this->judge0,
            $this->disk,
            $this->backup,
        ];
    }

    private function run(HealthCheck $check): CheckResult
    {
        try {
            return $check->run();
        } catch (Throwable $e) {
            return CheckResult::failed($e->getMessage());
        }
    }
}
