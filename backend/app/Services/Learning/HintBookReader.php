<?php

declare(strict_types=1);

namespace App\Services\Learning;

use App\Models\Exercise;
use App\Models\HintReveal;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Carbon;

/**
 * Egy diak tippjei egy feladatnal (#154).
 *
 * A diak az elso k tippet latja, ahol k a megnyitasainak szama. Igy a tippek
 * szerkesztese vagy atrendezese nem hagy "lyukat": a megnyitott tipp mindig a
 * jelenlegi sorrend elso k eleme, es a tobbi tartalma nem keruhet ki.
 */
final class HintBookReader
{
    public function for(Exercise $exercise, User $user): HintBook
    {
        $total = $exercise->hints()->count();
        $revealedCount = min($total, $this->revealedCount($exercise, $user));

        // Nincs megnyitott tipp: a tartalmat le sem kerdezzuk.
        $revealed = $revealedCount === 0 ? new Collection : $exercise->hints()->limit($revealedCount)->get();

        return new HintBook($total, $revealed);
    }

    /** Megnyitja a kovetkezo tippet, ha van. @return bool false, ha mar mind meg van nyitva. */
    public function revealNext(Exercise $exercise, User $user): bool
    {
        $total = $exercise->hints()->count();
        $next = $this->revealedCount($exercise, $user) + 1;

        if ($next > $total) {
            return false;
        }

        // insertOrIgnore: ket egyideju kerelem ugyanazt a sorszamot probalja, az egyik no-op.
        HintReveal::query()->insertOrIgnore([
            'user_id' => $user->id,
            'exercise_id' => $exercise->id,
            'position' => $next,
            'revealed_at' => Carbon::now(),
        ]);

        return true;
    }

    private function revealedCount(Exercise $exercise, User $user): int
    {
        return HintReveal::query()->where('user_id', $user->id)->where('exercise_id', $exercise->id)->count();
    }
}
