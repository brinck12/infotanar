<?php

declare(strict_types=1);

namespace App\Exceptions\Execution;

use App\Exceptions\DomainException;
use Illuminate\Http\JsonResponse;

final class NoVisibleTestCases extends DomainException
{
    public function __construct()
    {
        parent::__construct(__('execution.no_visible_test_cases'));
    }

    public function status(): int
    {
        return 422;
    }

    /** A futtatasi valasz alakjat koveti, hogy a kliens egy helyen kezelhesse. */
    public function render(): JsonResponse
    {
        return response()->json([
            'status' => 'error',
            'message' => $this->getMessage(),
            'results' => [],
        ], $this->status());
    }
}
