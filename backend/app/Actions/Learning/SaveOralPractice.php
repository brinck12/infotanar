<?php

declare(strict_types=1);

namespace App\Actions\Learning;

use App\Models\OralPractice;
use App\Models\User;

/**
 * Egy szobeli temakor gyakorlasi allapotanak mentese: a kipipalt vazlatpontok,
 * a jegyzet es az onertekeles egyszerre cserelodik. A gyakorlasok szamat nem
 * erinti; azt a RecordOralAttempt noveli.
 */
final readonly class SaveOralPractice
{
    /**
     * @param  string  $topic  Ellenorzott temakor-slug (config/learning.php `oral_topics`).
     * @param  list<int>  $checked
     * @param  array<string, int>  $scores
     */
    public function handle(User $user, string $topic, array $checked, string $notes, array $scores): OralPractice
    {
        // A (user_id, topic) egyedi kulcs: parhuzamos elso mentesnel az updateOrCreate
        // a mar letrejott sort frissiti, nem dob egyediseg-hibat.
        $practice = $user->oralPractices()->updateOrCreate(
            ['topic' => $topic],
            ['checked' => $checked, 'notes' => $notes === '' ? null : $notes, 'scores' => $scores],
        );

        // Uj sornal a nem irt oszlopok (last_practiced_at) hianyoznak a peldanybol,
        // a szigoru modell pedig hianyzo attributumnal kivetelt dob.
        return $practice->refresh();
    }
}
