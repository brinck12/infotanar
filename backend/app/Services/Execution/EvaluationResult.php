<?php

declare(strict_types=1);

namespace App\Services\Execution;

use App\Enums\Verdict;
use App\Services\Execution\Subtasks\SubtaskScore;

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
     * @param  list<SubtaskScore>|null  $subtasks  reszfeladatonkenti pontok; null, ha a feladat nem igy pontozott, vagy a megoldas nem futott le
     * @param  int  $score  reszfeladatos feladatnal a megszerzett pont, kulonben a teljesult tesztesetek szama
     * @param  int  $maxScore  az elerheto pont, illetve a kiertekeles teszteseteinek szama
     */
    public function __construct(
        public string $status,
        public Verdict $verdict,
        public array $results,
        public array $violations = [],
        public ?array $subtasks = null,
        public int $score = 0,
        public int $maxScore = 0,
    ) {}

    /**
     * A megoldas meg sem futott: a kodszabalyok (#42) ellenorzese mar a
     * Judge0 elott megakasztotta.
     *
     * @param  non-empty-list<string>  $violations
     */
    public static function constraintViolation(array $violations, int $maxScore): self
    {
        return new self('failed', Verdict::ConstraintViolation, [], $violations, maxScore: $maxScore);
    }

    /**
     * A `submissions.subtasks` oszlopba kerulo alak (megjegyzesek nelkul).
     *
     * @return list<array{label: string, points: int, max_points: int, passed: bool}>|null
     */
    public function storedSubtasks(): ?array
    {
        return $this->subtasks === null
            ? null
            : array_map(static fn (SubtaskScore $subtask): array => $subtask->toStoredArray(), $this->subtasks);
    }
}
