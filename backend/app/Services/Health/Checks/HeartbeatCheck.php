<?php

declare(strict_types=1);

namespace App\Services\Health\Checks;

use App\Services\Health\CheckResult;
use App\Services\Health\HealthCheck;
use App\Services\Health\Heartbeat;

/**
 * Egy hatterfolyamat (utemezo vagy queue worker) eletjelenek kora.
 * A szamlazas, a megujitas es a fizetesek egyeztetese ezeken mulik.
 */
final readonly class HeartbeatCheck implements HealthCheck
{
    public function __construct(
        private string $name,
        private string $heartbeatKey,
        private int $maxAgeSeconds,
    ) {}

    public function name(): string
    {
        return $this->name;
    }

    public function run(): CheckResult
    {
        $age = Heartbeat::secondsSince($this->heartbeatKey);

        return match (true) {
            $age === null => CheckResult::failed('Még nem érkezett életjel: a folyamat nem fut.'),
            $age > $this->maxAgeSeconds => CheckResult::failed("Az utolsó életjel {$age} másodperce érkezett (határ: {$this->maxAgeSeconds})."),
            default => CheckResult::ok("Utolsó életjel {$age} másodperce."),
        };
    }
}
