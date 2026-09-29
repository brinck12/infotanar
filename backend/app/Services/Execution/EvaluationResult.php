<?php

declare(strict_types=1);

namespace App\Services\Execution;

use App\Enums\Verdict;

/**
 * Egy futtatas/beadas kiertekelesenek eredmenye.
 *
 * A `status` (passed/failed/error) a prototipus ota letezo, visszafele
 * kompatibilis osszegzes; a `verdict` a PRD szerinti reszletes allapot.
 *
 * @phpstan-type TestResult array<string, mixed>
 */
final readonly class EvaluationResult
{
    /** @param list<TestResult> $results */
    public function __construct(
        public string $status,
        public Verdict $verdict,
        public array $results,
    ) {}
}
