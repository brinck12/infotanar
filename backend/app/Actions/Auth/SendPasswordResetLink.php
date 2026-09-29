<?php

declare(strict_types=1);

namespace App\Actions\Auth;

use Illuminate\Support\Facades\Password;

/**
 * Az eredmenyt (nincs ilyen fiok, tul gyakori keres) szandekosan elnyeljuk:
 * a hivo mindig ugyanazt a valaszt adja, hogy a fiokok ne legyenek felderithetok.
 */
final class SendPasswordResetLink
{
    public function handle(string $email): void
    {
        Password::broker()->sendResetLink(['email' => $email]);
    }
}
