<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Catalog;

use App\Http\Controllers\Controller;
use App\Http\Resources\TopicResource;
use App\Models\Topic;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

final class TopicController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $topics = Topic::query()
            ->withCount(['tasks' => static fn (Builder $query) => $query->where('is_published', true)])
            ->orderBy('name')
            ->get();

        return TopicResource::collection($topics);
    }
}
