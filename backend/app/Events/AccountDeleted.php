<?php

declare(strict_types=1);

namespace App\Events;

use App\Models\User;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * A fiok anonimizalasa utan (tranzakcio commit utan) fut le. A tobbi modul
 * erre iratkozik fel a sajat takaritasara, pl. az elofizetes lemondasara.
 */
final readonly class AccountDeleted
{
    use Dispatchable;

    public function __construct(public User $user) {}
}
