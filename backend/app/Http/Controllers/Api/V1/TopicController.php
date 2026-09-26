<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Topic;
use Illuminate\Http\JsonResponse;

class TopicController extends Controller
{
    public function index(): JsonResponse
    {
        $topics = Topic::query()
            ->withCount(['tasks' => fn ($q) => $q->where('is_published', true)])
            ->orderBy('name')
            ->get()
            ->map(fn (Topic $topic): array => [
                'id' => $topic->id,
                'name' => $topic->name,
                'slug' => $topic->slug,
                'task_count' => $topic->tasks_count,
            ]);

        return response()->json(['data' => $topics]);
    }
}
