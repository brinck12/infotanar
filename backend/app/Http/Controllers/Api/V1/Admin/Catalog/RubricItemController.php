<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin\Catalog;

use App\Actions\Admin\Catalog\ManageRubricItem;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Catalog\ReorderRequest;
use App\Http\Requests\Admin\Catalog\RubricItemRequest;
use App\Http\Resources\Admin\AdminRubricItemResource;
use App\Models\Exercise;
use App\Models\RubricItem;
use App\Models\User;
use Illuminate\Container\Attributes\CurrentUser;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

/**
 * Egy feladat ertekelolapjanak szerkesztese. A lista barmilyen fajtaju
 * feladatra valaszol (ures listaval), mert a szerkeszto minden feladatnal
 * megjeleniti a fulet.
 */
final class RubricItemController extends Controller
{
    public function __construct(private readonly ManageRubricItem $manage) {}

    public function index(Exercise $exercise): AnonymousResourceCollection
    {
        return AdminRubricItemResource::collection($exercise->rubricItems()->get());
    }

    public function store(RubricItemRequest $request, Exercise $exercise, #[CurrentUser] User $admin): JsonResponse
    {
        $item = $this->manage->create($exercise, $request->itemAttributes(), $admin);

        return AdminRubricItemResource::make($item)->response()->setStatusCode(JsonResponse::HTTP_CREATED);
    }

    public function update(RubricItemRequest $request, RubricItem $item, #[CurrentUser] User $admin): AdminRubricItemResource
    {
        return AdminRubricItemResource::make($this->manage->update($item, $request->itemAttributes(), $admin));
    }

    public function destroy(RubricItem $item, #[CurrentUser] User $admin): Response
    {
        $this->manage->delete($item, $admin);

        return response()->noContent();
    }

    public function reorder(ReorderRequest $request, Exercise $exercise, #[CurrentUser] User $admin): Response
    {
        $this->manage->reorder($exercise, $request->ids(), $admin);

        return response()->noContent();
    }
}
