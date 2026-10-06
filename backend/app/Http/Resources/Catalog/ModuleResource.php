<?php

declare(strict_types=1);

namespace App\Http\Resources\Catalog;

use App\Models\Lesson;
use App\Models\Module;
use App\Services\Catalog\LessonViewer;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Module */
final class ModuleResource extends JsonResource
{
    public function __construct(Module $module, private readonly LessonViewer $viewer)
    {
        parent::__construct($module);
    }

    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'title' => $this->title,
            'description' => $this->description,
            'lessons' => $this->lessons->map(fn (Lesson $lesson): LessonSummaryResource => new LessonSummaryResource($lesson, $this->viewer)),
        ];
    }
}
