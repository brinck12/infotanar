<?php

declare(strict_types=1);

namespace App\Services\Catalog;

use App\Models\Exercise;

/**
 * Egy feladat mintamegoldasos ellenorzesenek eredmenye (ExerciseVerifier).
 *
 * `passed`: minden teszteset / ertekelolap-pont atment a mintamegoldason;
 * `failed`: hianyzik a mintamegoldas, vagy valami nem ment at; `skipped`:
 * a szerver nem ertekeli (bongeszos feladat), nem hiba.
 *
 * @phpstan-type TestRow array{test_case_id: int|null, hidden: bool, passed: bool, verdict: string, verdict_label: string, time: string|null, message: string|null}
 * @phpstan-type RunRow array{language: string, passed: bool, verdict: string, verdict_label: string, score: int, max_score: int, tests: list<TestRow>}
 */
final readonly class ExerciseVerification
{
    public const PASSED = 'passed';

    public const FAILED = 'failed';

    public const SKIPPED = 'skipped';

    /**
     * @param  self::PASSED|self::FAILED|self::SKIPPED  $status
     * @param  list<RunRow>  $runs  kodfeladatnal nyelvenkent egy futas
     */
    public function __construct(
        public Exercise $exercise,
        public string $status,
        public ?string $message = null,
        public array $runs = [],
    ) {}

    public function isFailure(): bool
    {
        return $this->status === self::FAILED;
    }

    /** @return array<string, mixed> */
    public function toArray(): array
    {
        return [
            'exercise_id' => $this->exercise->id,
            'title' => $this->exercise->title,
            'kind' => $this->exercise->kind->value,
            'status' => $this->status,
            'message' => $this->message,
            'runs' => $this->runs,
        ];
    }
}
