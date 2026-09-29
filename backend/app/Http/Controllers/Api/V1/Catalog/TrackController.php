<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Catalog;

use App\Http\Controllers\Controller;
use App\Http\Resources\Catalog\TrackResource;
use App\Models\Track;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/** A negyszintu katalogus (Track > Module > Lesson > Exercise) publikus nezete. */
final class TrackController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $tracks = Track::query()
            ->published()
            ->withCount([
                'lessons' => static fn (Builder $query) => $query->where('lessons.is_published', true),
                'lessons as free_lessons_count' => static fn (Builder $query) => $query
                    ->where('lessons.is_published', true)
                    ->where('lessons.is_free', true),
            ])
            ->orderBy('position')
            ->get();

        return TrackResource::collection($tracks);
    }

    public function show(string $slug): TrackResource
    {
        $track = Track::query()
            ->published()
            ->where('slug', $slug)
            ->with([
                'modules.lessons' => static fn (Relation $query) => $query->where('is_published', true),
                'modules.lessons.exercises' => static fn (Relation $query) => $query->where('is_published', true),
            ])
            ->firstOrFail();

        return TrackResource::make($track);
    }
}
