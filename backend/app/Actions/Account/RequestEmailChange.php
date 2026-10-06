<?php

declare(strict_types=1);

namespace App\Actions\Account;

use App\Models\User;
use App\Notifications\ConfirmEmailChangeNotification;
use App\Notifications\EmailChangeRequestedNotification;
use Illuminate\Support\Facades\Notification;

/**
 * E-mail-cim csere elso lepese (#135): az uj cim megerositesre var, a
 * belepes addig a regivel megy. A megerosito link az UJ cimre megy (igy
 * bizonyitott, hogy a kero eleri), a REGI cim pedig ertesitest kap, hogy
 * egy jogosulatlan csere ne maradjon eszrevetlen.
 *
 * Ha a kert cim mar mas fiokhoz tartozik, csendben nem tortenik semmi: a
 * valasz ugyanaz, hogy a vegpontbol ne lehessen kideriteni, ki regisztralt.
 */
final class RequestEmailChange
{
    public function handle(User $user, string $newEmail): void
    {
        if ($newEmail === $user->email || User::query()->where('email', $newEmail)->exists()) {
            return;
        }

        $user->forceFill(['pending_email' => $newEmail])->save();

        Notification::route('mail', $newEmail)->notify(new ConfirmEmailChangeNotification($user));
        $user->notify(new EmailChangeRequestedNotification($newEmail));
    }
}
