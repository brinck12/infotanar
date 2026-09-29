<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Catalog;

use App\Http\Controllers\Controller;
use App\Http\Resources\TopicResource;
use App\Models\Module;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/** v1 "topics" = modulok, a publikalt feladataik szamaval. */
final class TopicController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $modules = Module::query()
            ->withCount(['exercises' => static fn (Builder $query) => $query
                ->where('exercises.is_published', true)
                ->where('lessons.is_published', true)])
            ->orderBy('title')
            ->get();

        return TopicResource::collection($modules);
    }
}
