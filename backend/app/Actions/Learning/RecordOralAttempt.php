<?php

declare(strict_types=1);

namespace App\Actions\Learning;

use App\Models\OralPractice;
use App\Models\User;

/** Egy befejezett szobeli gyakorlas rogzitese: eggyel no a szamlalo, es frissul az utolso gyakorlas ideje. */
final readonly class RecordOralAttempt
{
    /** @param string $topic Ellenorzott temakor-slug (config/learning.php `oral_topics`). */
    public function handle(User $user, string $topic): OralPractice
    {
        $practice = $user->oralPractices()->firstOrCreate(['topic' => $topic]);

        // Az adatbazisban novel (attempts = attempts + 1), igy ket egyideju keres
        // egyike sem vesz el; a visszaadott ertek ezert ujraolvasott.
        $practice->increment('attempts', 1, ['last_practiced_at' => now()]);

        return $practice->refresh();
    }
}
