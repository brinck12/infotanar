<?php

declare(strict_types=1);

namespace App\Exceptions\Execution;

use App\Exceptions\DomainException;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Config;

/**
 * Az egyidejuleg futo kiertekelesek kerete kimerult: nem a kero hibaja, ezert 503.
 *
 * A valasz egyszerre illik a futtatasi valasz alakjara (`status: "error"`, ures
 * `results`) es a percenkenti limit "busy" valaszara (`reason`, `retry_after`),
 * amit a frontend mar barati ertesitesre fordit.
 */
final class ExecutionCapacityExhausted extends DomainException
{
    public function __construct()
    {
        parent::__construct(__('execution.capacity_busy'));
    }

    public function status(): int
    {
        return 503;
    }

    public function render(): JsonResponse
    {
        $retryAfter = max(1, Config::integer('judge0.busy_retry_after'));

        return response()->json([
            'status' => 'error',
            'message' => $this->getMessage(),
            'reason' => 'busy',
            'retry_after' => $retryAfter,
            'results' => [],
        ], 503, ['Retry-After' => (string) $retryAfter]);
    }
}
