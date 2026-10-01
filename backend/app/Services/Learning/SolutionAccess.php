<?php

declare(strict_types=1);

namespace App\Services\Learning;

use App\Enums\SolutionStatus;
use App\Models\Exercise;
use App\Models\ExerciseSolution;
use App\Models\SolutionReveal;
use App\Models\Submission;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Config;

/**
 * Mikor lathatja a diak a mintamegoldast (#154). Az egyetlen hely, ahol ez a
 * szabaly el: a kliens csak megjeleniti, amit a szerver eldont.
 *
 *  - elfogadott beadas utan: lathato;
 *  - elotte, legalabb N sikertelen beadas utan: kifejezett megerositessel
 *    megnyithato, a megnyitas rogzitodik, es onnantol lathato;
 *  - egyebkent: zarolt.
 */
final class SolutionAccess
{
    public function stateFor(User $user, Exercise $exercise): SolutionState
    {
        $required = Config::integer('learning.solution.unlock_after_failed_submissions');
        $submissions = Submission::query()->where('user_id', $user->id)->where('exercise_id', $exercise->id);

        $solved = (clone $submissions)->where('status', 'passed')->exists();
        // Elfogadott beadas utan a sikertelenek szama mar nem szamit.
        $failed = $solved ? 0 : (clone $submissions)->where('status', 'failed')->count();

        $status = match (true) {
            $solved, $this->hasRevealed($user, $exercise) => SolutionStatus::Unlocked,
            $failed >= $required => SolutionStatus::Revealable,
            default => SolutionStatus::Locked,
        };

        return new SolutionState($status, $failed, $required);
    }

    /** A diak megoldas ELOTT megnyitotta-e (az ilyen utani beadasok `assisted` jelolest kapnak). */
    public function hasRevealed(User $user, Exercise $exercise): bool
    {
        return SolutionReveal::query()->where('user_id', $user->id)->where('exercise_id', $exercise->id)->exists();
    }

    /** Megoldas elotti megnyitas rogzitese; ismetelt hivas nem hoz letre ujat. */
    public function recordReveal(User $user, Exercise $exercise, int $failedSubmissions): void
    {
        SolutionReveal::query()->insertOrIgnore([
            'user_id' => $user->id,
            'exercise_id' => $exercise->id,
            'failed_submissions' => $failedSubmissions,
            'revealed_at' => Carbon::now(),
        ]);
    }

    /** A megoldasok csak feloldott allapotban kerulnek a nezetbe, es csak az engedelyezett nyelvekre. */
    public function viewFor(User $user, Exercise $exercise): SolutionView
    {
        $state = $this->stateFor($user, $exercise);

        return new SolutionView($state, $state->status === SolutionStatus::Unlocked ? $this->solutionsOf($exercise) : new Collection);
    }

    /** @return Collection<int, ExerciseSolution> */
    private function solutionsOf(Exercise $exercise): Collection
    {
        return $exercise->solutions()->whereIn('language', $exercise->allowed_languages ?? [])->get();
    }
}
