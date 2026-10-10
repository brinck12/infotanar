<?php

declare(strict_types=1);

namespace App\Http\Resources\Admin;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * A szerepkor-valtas eredmenye: csak az, ami valtozott. A kliens a reszletek
 * lekerdezeset ujratolti, igy nincs masodik "igazsag" a felhasznalorol.
 *
 * @mixin User
 */
final class AdminUserRoleResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'role' => $this->role->value,
        ];
    }
}
