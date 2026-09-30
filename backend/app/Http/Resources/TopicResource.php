<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Module;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * v1 szerzodes: a modul "topic"-kent megy ki (`name`, `task_count`), hogy a
 * meglevo kliensek valtozatlanul mukodjenek.
 *
 * @mixin Module
 */
final class TopicResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->title,
            'slug' => $this->slug,
            'task_count' => $this->whenCounted('exercises'),
        ];
    }
}
