<?php

declare(strict_types=1);

namespace App\Http\Resources\Admin;

use App\Models\AccessGrant;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin AccessGrant */
final class AccessGrantResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'reason' => $this->reason,
            'active' => $this->isActive(),
            'ends_at' => $this->ends_at?->toIso8601String(),
            'granted_at' => $this->created_at?->toIso8601String(),
            'granted_by' => $this->whenLoaded('grantedBy', fn (): ?array => $this->grantedBy === null ? null : ['id' => $this->grantedBy->id, 'name' => $this->grantedBy->name]),
            'revoked_at' => $this->revoked_at?->toIso8601String(),
            'revoked_by' => $this->whenLoaded('revokedBy', fn (): ?array => $this->revokedBy === null ? null : ['id' => $this->revokedBy->id, 'name' => $this->revokedBy->name]),
        ];
    }
}
