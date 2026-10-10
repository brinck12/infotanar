<?php

declare(strict_types=1);

namespace App\Services\Health;

final readonly class CheckResult
{
    private function __construct(
        public HealthStatus $status,
        public ?string $detail,
    ) {}

    public static function ok(?string $detail = null): self
    {
        return new self(HealthStatus::Ok, $detail);
    }

    public static function degraded(string $detail): self
    {
        return new self(HealthStatus::Degraded, $detail);
    }

    public static function failed(string $detail): self
    {
        return new self(HealthStatus::Failed, $detail);
    }
}
