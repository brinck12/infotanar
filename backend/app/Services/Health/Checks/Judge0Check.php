<?php

declare(strict_types=1);

namespace App\Services\Health\Checks;

use App\Services\Health\CheckResult;
use App\Services\Health\HealthCheck;
use App\Services\Judge0Service;

/** Judge0 nelkul a kodfuttatas all, de a tananyag, a belepes es a fizetes megy: ezert csak figyelmeztetes. */
final readonly class Judge0Check implements HealthCheck
{
    public function __construct(private Judge0Service $judge0) {}

    public function name(): string
    {
        return 'judge0';
    }

    public function run(): CheckResult
    {
        return $this->judge0->isReachable()
            ? CheckResult::ok()
            : CheckResult::degraded('A Judge0 nem érhető el: a kódfuttatás nem működik.');
    }
}
