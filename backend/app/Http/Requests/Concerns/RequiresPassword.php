<?php

declare(strict_types=1);

namespace App\Http\Requests\Concerns;

use App\Exceptions\Auth\PasswordRequired;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Jelszot (`current_password`) kero muvelet olyan fiokon, amelyhez nincs jelszo
 * (kozossegi belepessel nyitott): ertheto hiba a felrevezeto "rossz jelszo" helyett.
 *
 * @mixin FormRequest
 */
trait RequiresPassword
{
    /** @throws PasswordRequired */
    protected function ensureHasPassword(): void
    {
        $user = $this->user();

        if ($user instanceof User && ! $user->hasPassword()) {
            throw new PasswordRequired;
        }
    }
}
