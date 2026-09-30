<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin\Catalog;

use App\Actions\Admin\Catalog\ManageCatalogItem;
use App\Exceptions\Catalog\CatalogItemInUse;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Catalog\ModuleRequest;
use App\Http\Resources\Admin\AdminModuleResource;
use App\Models\Module;
use App\Models\User;
use Illuminate\Container\Attributes\CurrentUser;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

final class ModuleController extends Controller
{
    private const PARENT = 'track_id';

    public function __construct(private readonly ManageCatalogItem $manage) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $modules = Module::query()
            ->withCount('lessons')
            ->when($request->integer('track_id'), static fn ($q, int $trackId) => $q->where('track_id', $trackId))
            ->orderBy('track_id')
            ->orderBy('position')
            ->get();

        return AdminModuleResource::collection($modules);
    }

    public function show(Module $module): AdminModuleResource
    {
        return AdminModuleResource::make($module->load(['lessons' => static fn (Relation $q) => $q->withCount('exercises')]));
    }

    public function store(ModuleRequest $request, #[CurrentUser] User $admin): JsonResponse
    {
        $module = $this->manage->create(new Module($request->validated()), self::PARENT, $admin);

        return AdminModuleResource::make($module)->response()->setStatusCode(JsonResponse::HTTP_CREATED);
    }

    public function update(ModuleRequest $request, Module $module, #[CurrentUser] User $admin): AdminModuleResource
    {
        return AdminModuleResource::make($this->manage->update($module, $request->validated(), self::PARENT, $admin));
    }

    /** @throws CatalogItemInUse */
    public function destroy(Module $module, #[CurrentUser] User $admin): Response
    {
        if ($module->lessons()->exists()) {
            throw CatalogItemInUse::hasChildren();
        }

        $this->manage->delete($module, self::PARENT, $admin);

        return response()->noContent();
    }
}
