<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin\Catalog;

use App\Actions\Admin\Catalog\ManageCatalogItem;
use App\Exceptions\Catalog\CatalogItemInUse;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Catalog\TrackRequest;
use App\Http\Resources\Admin\AdminTrackResource;
use App\Models\Track;
use App\Models\User;
use Illuminate\Container\Attributes\CurrentUser;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

final class TrackController extends Controller
{
    public function __construct(private readonly ManageCatalogItem $manage) {}

    public function index(): AnonymousResourceCollection
    {
        return AdminTrackResource::collection(Track::query()->withCount('modules')->orderBy('position')->get());
    }

    public function show(Track $track): AdminTrackResource
    {
        return AdminTrackResource::make($track->load(['modules' => static fn (Relation $q) => $q->withCount('lessons')]));
    }

    public function store(TrackRequest $request, #[CurrentUser] User $admin): JsonResponse
    {
        $track = $this->manage->create(new Track($request->validated()), null, $admin);

        return AdminTrackResource::make($track)->response()->setStatusCode(JsonResponse::HTTP_CREATED);
    }

    public function update(TrackRequest $request, Track $track, #[CurrentUser] User $admin): AdminTrackResource
    {
        return AdminTrackResource::make($this->manage->update($track, $request->validated(), null, $admin));
    }

    /** @throws CatalogItemInUse */
    public function destroy(Track $track, #[CurrentUser] User $admin): Response
    {
        if ($track->modules()->exists()) {
            throw CatalogItemInUse::hasChildren();
        }

        $this->manage->delete($track, null, $admin);

        return response()->noContent();
    }
}
