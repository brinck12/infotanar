<?php

declare(strict_types=1);

namespace App\Http\Resources\Admin;

use App\Models\InviteCode;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin InviteCode */
final class InviteCodeResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'label' => $this->label,
            'max_uses' => $this->max_uses,
            'uses' => $this->uses,
            // active | disabled | expired | used_up
            'state' => $this->state(),
            'expires_at' => $this->expires_at?->toIso8601String(),
            'disabled_at' => $this->disabled_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            'created_by' => $this->whenLoaded('createdBy', fn (): ?array => $this->createdBy === null ? null : ['id' => $this->createdBy->id, 'name' => $this->createdBy->name]),
        ];
    }
}
