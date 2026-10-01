<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Catalog;

use App\Actions\Catalog\IssueLessonVideoUrl;
use App\Exceptions\Catalog\LessonVideoMissing;
use App\Http\Controllers\Controller;
use App\Models\Lesson;
use App\Models\User;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Storage;
use League\Flysystem\Local\LocalFilesystemAdapter;
use Symfony\Component\HttpFoundation\Response;

final class LessonVideoController extends Controller
{
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

    /**
     * Csak ervenyes, lejarat elotti alairassal erheto el (signed:relative).
     * Helyi tarolonal BinaryFileResponse: tamogatja a Range kereseket, igy a
     * lejatszoban lehet tekerni.
     */
    public function stream(int $lesson): Response
    {
        $model = $this->publishedLesson($lesson);
        $disk = Storage::disk(Config::string('catalog.video.disk'));

        if ($model->video_path === null || ! $disk->exists($model->video_path)) {
            throw new LessonVideoMissing;
        }

        $response = $this->isLocal($disk)
            ? response()->file($disk->path($model->video_path))
            : $disk->response($model->video_path);

        // A BinaryFileResponse alapbol "public": egy kozos cache (proxy, CDN)
        // tovabbadhatna a premium videot. Csak a kero bongeszoje tarolhatja.
        $response->setPrivate();
        $response->setMaxAge(600);
        $response->headers->set('X-Content-Type-Options', 'nosniff');

        return $response;
    }

    /** A felirat (#111), a videoval azonos alairt, lejaro URL-en at. */
    public function captions(int $lesson): Response
    {
        $model = $this->publishedLesson($lesson);
        $disk = Storage::disk(Config::string('catalog.video.disk'));

        if ($model->captions_path === null || ! $disk->exists($model->captions_path)) {
            throw new LessonVideoMissing;
        }

        $response = $this->isLocal($disk)
            ? response()->file($disk->path($model->captions_path), ['Content-Type' => 'text/vtt; charset=utf-8'])
            : $disk->response($model->captions_path, null, ['Content-Type' => 'text/vtt; charset=utf-8']);

        $response->setPrivate();
        $response->setMaxAge(600);
        $response->headers->set('X-Content-Type-Options', 'nosniff');

        return $response;
    }

    private function publishedLesson(int $id): Lesson
    {
        return Lesson::query()->published()->findOrFail($id);
    }

    private function isLocal(FilesystemAdapter $disk): bool
    {
        return $disk->getAdapter() instanceof LocalFilesystemAdapter;
    }
}
