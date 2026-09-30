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
    /**
     * @param  list<TestResult>  $results
     * @param  list<string>  $violations  megsertett kodszabalyok, magyarul (csak ConstraintViolation eseten)
     */
    public function __construct(
        public string $status,
        public Verdict $verdict,
        public array $results,
        public array $violations = [],
    ) {}

    /**
     * A megoldas meg sem futott: a kodszabalyok (#42) ellenorzese mar a
     * Judge0 elott megakasztotta.
     *
     * @param  non-empty-list<string>  $violations
     */
    public static function constraintViolation(array $violations): self
    {
        return new self('failed', Verdict::ConstraintViolation, [], $violations);
    }
}
