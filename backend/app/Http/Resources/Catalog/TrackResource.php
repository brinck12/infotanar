<?php

declare(strict_types=1);

namespace App\Http\Resources\Catalog;

use App\Models\Module;
use App\Models\Track;
use App\Services\Catalog\LessonViewer;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Egy kepzesi ag teljes szerkezete a nezo szemszogebol (`GET /tracks/{slug}`):
 * modulok, leckek (zarolas, haladas) es feladatok.
 *
 * @mixin Track
 */
final class TrackResource extends JsonResource
{
    public function __construct(Track $track, private readonly LessonViewer $viewer)
    {
        parent::__construct($track);
    }

    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'title' => $this->title,
            'description' => $this->description,
            'modules' => $this->modules->map(fn (Module $module): ModuleResource => new ModuleResource($module, $this->viewer)),
        ];
    }
}
