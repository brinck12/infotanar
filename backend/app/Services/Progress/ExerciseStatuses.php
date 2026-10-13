<?php

declare(strict_types=1);

namespace App\Services\Progress;

use App\Enums\ExerciseProgressStatus;
use App\Models\User;

/**
 * Egy nezo feladatonkenti allapota (#146): megoldotta, probalta, vagy meg nem
 * nyult hozza. Egyetlen lekerdezes a kod- es a gyakorlo fajlbeadasokon
 * (ExerciseAttempts), akarhany feladatot listazunk; vendegnel lekerdezes sincs.
 */
final readonly class ExerciseStatuses
{
    /** @param array<int, ExerciseProgressStatus> $byExercise feladat id => allapot */
    private function __construct(
        private bool $hasViewer,
        private array $byExercise,
    ) {}

    public static function for(?User $viewer): self
    {
        if ($viewer === null) {
            return new self(false, []);
        }

        $byExercise = [];

        foreach (ExerciseAttempts::outcomesFor($viewer) as $exerciseId => $solved) {
            $byExercise[$exerciseId] = $solved ? ExerciseProgressStatus::Solved : ExerciseProgressStatus::Attempted;
        }

        return new self(true, $byExercise);
    }

    /** Vendegnel hamis: a valaszokbol ilyenkor az allapot mezoje is kimarad. */
    public function hasViewer(): bool
    {
        return $this->hasViewer;
    }

    public function of(int $exerciseId): ?ExerciseProgressStatus
    {
        return $this->byExercise[$exerciseId] ?? null;
    }
}
