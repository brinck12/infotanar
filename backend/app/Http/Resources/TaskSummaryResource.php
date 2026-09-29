<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Enums\AccessDenial;
use App\Models\Exercise;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * v1 lista-nezet ("task"): leiras es tesztesetek nelkul, a kero
 * szemszogebol vett zarolassal.
 *
 * @mixin Exercise
 */
final class TaskSummaryResource extends JsonResource
{
    public function __construct(Exercise $exercise, private readonly ?AccessDenial $denial = null)
    {
        parent::__construct($exercise);
    }

    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'level' => $this->level,
            'difficulty' => $this->difficulty,
            'allowed_languages' => $this->allowed_languages,
            'is_free' => $this->whenLoaded('lesson', fn () => $this->lesson->is_free),
            'locked' => $this->denial !== null,
            'topic' => TopicResource::make($this->whenLoaded('lesson', fn () => $this->lesson->module)),
        ];
    }
}
