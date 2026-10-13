<?php

declare(strict_types=1);

namespace App\Services\Exams;

use App\Models\Exam;
use App\Models\ExamPart;
use Illuminate\Database\Eloquent\Relations\Relation;

/**
 * Egy vizsgaresz készültsége a szerkesztőnek és a közzétételhez:
 *
 *  - szerkesztős feladat (`code`, `sql`): `tests`, ha van legalább egy látható
 *    teszteset; különben `incomplete`;
 *  - feltöltős feladat: `complete`, ha az értékelőlap pontjainak összege eléri a
 *    célt (`spec.raw_points`, vagy a rész pontja); különben `incomplete`;
 *  - feladat nélküli (vagy más fajtájú) rész: `incomplete`.
 *
 * A feladathoz be kell tölteni a `rubric_items_sum_points` és a
 * `visible_test_cases_count` összesítést (lásd `eager()`).
 */
final class PartReadiness
{
    public const TESTS = 'tests';

    public const COMPLETE = 'complete';

    public const INCOMPLETE = 'incomplete';

    /**
     * A `parts.exercise` betöltése az összesítésekkel; az `Exam::with()`-nek adható.
     *
     * @return array<string, \Closure(Relation<*, *, *>): mixed>
     */
    public static function eager(): array
    {
        return [
            'parts.exercise' => static fn (Relation $exercises) => $exercises
                ->withSum('rubricItems', 'points')
                ->withCount('visibleTestCases'),
        ];
    }

    /**
     * A vizsga részei az összesítésekkel együtt, frissen betöltve.
     */
    public static function load(Exam $exam): Exam
    {
        return $exam->load(self::eager());
    }

    /** @return array{status: string, missing_points: int} */
    public function of(ExamPart $part): array
    {
        $exercise = $part->exercise;

        if ($exercise === null) {
            return ['status' => self::INCOMPLETE, 'missing_points' => $part->points];
        }

        if ($exercise->kind->isEditorBased()) {
            $tests = self::number($exercise->getAttribute('visible_test_cases_count'));

            return $tests > 0
                ? ['status' => self::TESTS, 'missing_points' => 0]
                : ['status' => self::INCOMPLETE, 'missing_points' => $part->points];
        }

        if ($exercise->kind->isUpload()) {
            $raw = $exercise->spec['raw_points'] ?? null;
            $target = is_numeric($raw) ? (int) $raw : $part->points;
            $total = self::number($exercise->getAttribute('rubric_items_sum_points'));

            return $total > 0 && $total >= $target
                ? ['status' => self::COMPLETE, 'missing_points' => 0]
                : ['status' => self::INCOMPLETE, 'missing_points' => max(0, $target - $total)];
        }

        return ['status' => self::INCOMPLETE, 'missing_points' => $part->points];
    }

    /** Az összesítő oszlop értéke: NULL (nincs sor) vagy szám. */
    private static function number(mixed $value): int
    {
        return is_numeric($value) ? (int) $value : 0;
    }
}
