<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Catalog;

use App\Actions\Catalog\IssueLessonVideoUrl;
use App\Http\Controllers\Controller;
use App\Models\Lesson;
use App\Models\User;
use App\Services\Catalog\Media\MediaResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class LessonVideoController extends Controller
{
    public function __construct(private readonly MediaResponse $media) {}

    /** Rovid eletu lejatszasi URL a hozzaferes ellenorzese utan. */
    public function show(Request $request, int $lesson, IssueLessonVideoUrl $issue): JsonResponse
    {
        $user = $request->user('sanctum');
        $video = $issue->handle($this->publishedLesson($lesson), $user instanceof User ? $user : null);

        return response()->json([
            'data' => [
                'url' => $video->url,
                'captions_url' => $video->captionsUrl,
                'expires_at' => $video->expiresAt->toIso8601String(),
            ],
        ])->header('Cache-Control', 'no-store');
    }

    /** Csak ervenyes, lejarat elotti alairassal erheto el (signed:relative). */
    public function stream(int $lesson): Response
    {
        return $this->media->video($this->publishedLesson($lesson)->video_path);
    }

    /** A felirat (#111), a videoval azonos alairt, lejaro URL-en at. */
    public function captions(int $lesson): Response
    {
        return $this->media->captions($this->publishedLesson($lesson)->captions_path);
    }

    private function publishedLesson(int $id): Lesson
    {
        return Lesson::query()->published()->findOrFail($id);
    }
}
