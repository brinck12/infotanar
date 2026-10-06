<?php

declare(strict_types=1);

namespace App\Services\Progress;

use App\Enums\ExerciseProgressStatus;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Egy nezo feladatonkenti allapota (#146): megoldotta, probalta, vagy meg nem
 * nyult hozza. Egyetlen csoportositott lekerdezes a beadasokon, akarhany
 * feladatot listazunk; vendegnel lekerdezes sincs.
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

        $rows = DB::table('submissions')
            ->where('user_id', $viewer->id)
            ->groupBy('exercise_id')
            ->selectRaw("exercise_id, MAX(CASE WHEN status = 'passed' THEN 1 ELSE 0 END) AS solved")
            ->pluck('solved', 'exercise_id');

        $byExercise = [];

        foreach ($rows as $exerciseId => $solved) {
            $byExercise[(int) $exerciseId] = is_numeric($solved) && (int) $solved === 1
                ? ExerciseProgressStatus::Solved
                : ExerciseProgressStatus::Attempted;
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
