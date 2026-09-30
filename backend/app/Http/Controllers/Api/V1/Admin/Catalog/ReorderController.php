<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin\Catalog;

use App\Actions\Admin\Catalog\ManageCatalogItem;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Catalog\ReorderRequest;
use App\Models\Exercise;
use App\Models\Lesson;
use App\Models\Module;
use App\Models\Track;
use App\Models\User;
use Illuminate\Container\Attributes\CurrentUser;
use Illuminate\Http\Response;

/** Egy szulo gyerekeinek uj sorrendje (a teljes azonosito-listaval). */
final class ReorderController extends Controller
{
    public function __construct(private readonly ManageCatalogItem $manage) {}

    public function tracks(ReorderRequest $request, #[CurrentUser] User $admin): Response
    {
        $this->manage->reorder(Track::query(), $request->ids(), null, $admin);

        return response()->noContent();
    }

    public function modules(ReorderRequest $request, Track $track, #[CurrentUser] User $admin): Response
    {
        $this->manage->reorder(Module::query()->where('track_id', $track->id), $request->ids(), $track, $admin);

        return response()->noContent();
    }

    public function lessons(ReorderRequest $request, Module $module, #[CurrentUser] User $admin): Response
    {
        $this->manage->reorder(Lesson::query()->where('module_id', $module->id), $request->ids(), $module, $admin);

        return response()->noContent();
    }

    public function exercises(ReorderRequest $request, Lesson $lesson, #[CurrentUser] User $admin): Response
    {
        $this->manage->reorder(Exercise::query()->where('lesson_id', $lesson->id), $request->ids(), $lesson, $admin);

        return response()->noContent();
    }
}
