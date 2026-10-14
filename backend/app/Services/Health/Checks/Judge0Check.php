<?php

declare(strict_types=1);

namespace App\Services\Health\Checks;

use App\Services\Health\CheckResult;
use App\Services\Health\HealthCheck;
use App\Services\Judge0Service;
use Illuminate\Support\Facades\Config;

/**
 * Judge0 nelkul a kodfuttatas all, de a tananyag, a belepes es a fizetes megy: ezert csak figyelmeztetes.
 * Az ellenorzes a Judge0 varakozo sorat is nezi: ha hosszu, a futtatasok lassulnak.
 */
final readonly class Judge0Check implements HealthCheck
{
    public function __construct(private Judge0Service $judge0) {}

    public function name(): string
    {
        return 'judge0';
    }

    public function run(): CheckResult
    {
        if (! $this->judge0->isReachable()) {
            return CheckResult::degraded('A Judge0 nem érhető el: a kódfuttatás nem működik.');
        }

        $depth = $this->judge0->queueDepth();
        $warnAt = Config::integer('judge0.queue_warn_depth');

        // Nem merheto (a peldany nem adja a /workers vegpontot): nem hiba.
        if ($depth === null) {
            return CheckResult::ok();
        }

        return $warnAt > 0 && $depth > $warnAt
            ? CheckResult::degraded("A Judge0 sora hosszú: {$depth} várakozó beadás (határ: {$warnAt}).")
            : CheckResult::ok("Judge0 sor: {$depth}");
    }
}
