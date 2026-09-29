<?php

declare(strict_types=1);

namespace App\Services\Execution;

/**
 * Egy futtatas/beadas kiertekelesenek eredmenye.
 *
 * @phpstan-type TestResult array<string, mixed>
 */
final readonly class EvaluationResult
{
    /** @param list<TestResult> $results */
    public function __construct(
        public string $status,
        public array $results,
    ) {}
}
