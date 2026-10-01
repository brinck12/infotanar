<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Catalog;

use App\Actions\Progress\BuildProgressReport;
use App\Http\Controllers\Controller;
use App\Http\Resources\Catalog\TrackResource;
use App\Http\Resources\Catalog\TrackSummaryResource;
use App\Models\Track;
use App\Models\User;
use App\Services\Access\ContentAccess;
use App\Services\Catalog\LessonViewer;
use App\Services\Progress\ProgressSummary;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * A negyszintu katalogus (Track > Module > Lesson > Exercise) publikus nezete.
 * Vendegkent is hivhato; bejelentkezve a valasz a nezo haladasat es a neki
 * zarolt leckeket is jelzi. A lekerdezesek szama a katalogus meretetol fuggetlen.
 */
final class TrackController extends Controller
{
    public function index(Request $request, BuildProgressReport $buildReport): JsonResponse
    {
        $tracks = Track::query()
            ->published()
            ->withCount([
                'modules',
                'lessons' => static fn (Builder $query) => $query->where('lessons.is_published', true),
                'lessons as free_lessons_count' => static fn (Builder $query) => $query
                    ->where('lessons.is_published', true)
                    ->where('lessons.is_free', true),
            ])
            ->orderBy('position')
            ->get();

        $progress = $this->progressByTrack($this->viewer($request), $buildReport);

        return response()->json([
            'data' => $tracks->map(static fn (Track $track): TrackSummaryResource => new TrackSummaryResource($track, $progress[$track->id] ?? null)),
        ]);
    }

    /** @return array<int, ProgressSummary> track id => a nezo haladasa; vendegnel ures */
    private function progressByTrack(?User $viewer, BuildProgressReport $buildReport): array
    {
        if ($viewer === null) {
            return [];
        }

        $byTrack = [];

        foreach ($buildReport->handle($viewer)->tracks as $trackProgress) {
            $byTrack[$trackProgress->track->id] = $trackProgress->summary;
        }

        return $byTrack;
    }

    public function show(Request $request, string $slug, ContentAccess $access): TrackResource
    {
        $track = Track::query()
            ->published()
            ->where('slug', $slug)
            ->with([
                // A lecke tartalma (akar tobb tiz KB) ide nem kell, ezert csak a listahoz szukseges oszlopok.
                'modules.lessons' => static fn (Relation $query) => $query
                    ->where('is_published', true)
                    ->select(['id', 'module_id', 'slug', 'title', 'position', 'is_free', 'is_published', 'video_path']),
                'modules.lessons.exercises' => static fn (Relation $query) => $query->where('is_published', true),
            ])
            ->firstOrFail();

        return new TrackResource($track, LessonViewer::for($this->viewer($request), $access));
    }

    private function viewer(Request $request): ?User
    {
        $user = $request->user('sanctum');

        return $user instanceof User ? $user : null;
    }
}
