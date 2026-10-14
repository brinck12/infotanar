<?php

declare(strict_types=1);

namespace App\Services\Progress;

use App\Models\User;
use Closure;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Query\Builder as QueryBuilder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * A haladas egyetlen helye, amely mindket beadasi forrast ismeri: a kodbeadasokat
 * (`submissions`) es a gyakorlo fajlbeadasokat (`file_submissions`). A vizsgasorok
 * (`exam_attempt_id` kitoltve) soha nem szamitanak bele.
 *
 * Megoldott: kodnal `status = passed`, fajlnal `passed = true` (a ratio dontese a
 * fajlbeadas ertekelesekor van, filetasks.pass_ratio). Megprobalt: barmelyik forrasban van sor.
 */
final class ExerciseAttempts
{
    /**
     * Feladat id => megoldotta-e. Egyetlen lekerdezes a ket forrason.
     *
     * @return array<int, bool>
     */
    public static function outcomesFor(User $user): array
    {
        $code = DB::table('submissions')
            ->where('user_id', $user->id)
            ->groupBy('exercise_id')
            ->selectRaw("exercise_id, MAX(CASE WHEN status = 'passed' THEN 1 ELSE 0 END) AS solved");

        $files = DB::table('file_submissions')
            ->where('user_id', $user->id)
            ->whereNull('exam_attempt_id')
            ->groupBy('exercise_id')
            ->selectRaw('exercise_id, MAX(CASE WHEN passed THEN 1 ELSE 0 END) AS solved');

        $rows = DB::query()->fromSub($code->unionAll($files), 'attempts')->get();

        $outcomes = [];

        foreach ($rows as $row) {
            $id = is_numeric($row->exercise_id) ? (int) $row->exercise_id : 0;
            $solved = is_numeric($row->solved) && (int) $row->solved === 1;
            $outcomes[$id] = ($outcomes[$id] ?? false) || $solved;
        }

        return $outcomes;
    }

    /**
     * A felhasznalo altal megoldott feladatok azonositoi.
     *
     * @return Collection<int, int>
     */
    public static function solvedBy(User $user): Collection
    {
        return collect(array_keys(array_filter(self::outcomesFor($user))));
    }

    /**
     * Minden feladat, amelyhez a felhasznalonak van beadasa (megoldott is).
     *
     * @return Collection<int, int>
     */
    public static function attemptedBy(User $user): Collection
    {
        return collect(array_keys(self::outcomesFor($user)));
    }

    /**
     * Azok a leckek, amelyek valamelyik feladatahoz a felhasznalonak van beadasa.
     *
     * @return Collection<int, int>
     */
    public static function attemptedLessonsOf(User $user): Collection
    {
        $code = DB::table('submissions')
            ->join('exercises', 'exercises.id', '=', 'submissions.exercise_id')
            ->where('submissions.user_id', $user->id)
            ->select('exercises.lesson_id');

        $files = DB::table('file_submissions')
            ->join('exercises', 'exercises.id', '=', 'file_submissions.exercise_id')
            ->where('file_submissions.user_id', $user->id)
            ->whereNull('file_submissions.exam_attempt_id')
            ->select('exercises.lesson_id');

        return DB::query()
            ->fromSub($code->union($files), 'attempted')
            ->pluck('lesson_id')
            ->map(static fn (mixed $id): int => is_numeric($id) ? (int) $id : 0);
    }

    /**
     * A `exercises` lekerdezesre szuro feltetel: van (vagy `$negate` eseten nincs)
     * beadasa a felhasznalonak, barmelyik forrasban. `$onlyPassed` csak a megoldottat nezi.
     *
     * @param  Builder<covariant \Illuminate\Database\Eloquent\Model>  $exercises
     */
    public static function existsClause(Builder $exercises, int $userId, bool $onlyPassed, bool $negate = false): void
    {
        $group = static function (Builder $group) use ($userId, $onlyPassed): void {
            $group
                ->whereExists(self::codeAttempts($userId, $onlyPassed))
                ->orWhereExists(self::fileAttempts($userId, $onlyPassed));
        };

        if ($negate) {
            $exercises->whereNot($group);
        } else {
            $exercises->where($group);
        }
    }

    /** @return Closure(QueryBuilder): void */
    private static function codeAttempts(int $userId, bool $onlyPassed): Closure
    {
        return static function (QueryBuilder $query) use ($userId, $onlyPassed): void {
            $query->from('submissions')
                ->selectRaw('1')
                ->whereColumn('submissions.exercise_id', 'exercises.id')
                ->where('submissions.user_id', $userId)
                ->when($onlyPassed, static fn (QueryBuilder $passed) => $passed->where('submissions.status', 'passed'));
        };
    }

    /** @return Closure(QueryBuilder): void */
    private static function fileAttempts(int $userId, bool $onlyPassed): Closure
    {
        return static function (QueryBuilder $query) use ($userId, $onlyPassed): void {
            $query->from('file_submissions')
                ->selectRaw('1')
                ->whereColumn('file_submissions.exercise_id', 'exercises.id')
                ->where('file_submissions.user_id', $userId)
                ->whereNull('file_submissions.exam_attempt_id')
                ->when($onlyPassed, static fn (QueryBuilder $passed) => $passed->where('file_submissions.passed', true));
        };
    }
}
