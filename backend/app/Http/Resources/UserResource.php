<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin User */
final class UserResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            // Megerositesre varo uj cim (#135); null, ha nincs folyamatban csere.
            'pending_email' => $this->pending_email,
            'role' => $this->role,
            'email_verified_at' => $this->email_verified_at,
        ];
    }
}
