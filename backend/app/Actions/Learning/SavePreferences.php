<?php

declare(strict_types=1);

namespace App\Actions\Learning;

use App\Models\User;

/** A tanulasi celok (szint, vizsgaidoszak, nyelv, heti oraszam) mentese a felhasznalohoz. */
final readonly class SavePreferences
{
    /**
     * @param  array{level: string, exam_period: string, language: string, weekly_hours: string}  $preferences  Ellenorzott ertekek.
     * @return array{level: string, exam_period: string, language: string, weekly_hours: string}
     */
    public function handle(User $user, array $preferences): array
    {
        // A `preferences` nem tomegesen kitoltheto (lasd User), ezert forceFill.
        $user->forceFill(['preferences' => $preferences])->save();

        return $preferences;
    }
}
