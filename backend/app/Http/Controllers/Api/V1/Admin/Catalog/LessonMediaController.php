<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin\Catalog;

use App\Actions\Admin\Catalog\ManageLessonMedia;
use App\Exceptions\Catalog\InvalidCaptionsFile;
use App\Exceptions\Catalog\LessonVideoMissing;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Catalog\CaptionsUploadRequest;
use App\Http\Resources\Admin\AdminLessonResource;
use App\Models\Lesson;
use App\Models\User;
use App\Services\Catalog\Media\LessonMediaInspector;
use App\Services\Catalog\Media\MediaResponse;
use Carbon\CarbonImmutable;
use Illuminate\Container\Attributes\CurrentUser;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\URL;
use Symfony\Component\HttpFoundation\Response;

/** A lecke videoja es felirata az admin feluleten (#158): felirat-feltoltes, eltavolitas, elonezet. */
final class LessonMediaController extends Controller
{
    public function __construct(
        private readonly ManageLessonMedia $media,
        private readonly LessonMediaInspector $inspector,
    ) {}

    /** @throws InvalidCaptionsFile */
    public function storeCaptions(CaptionsUploadRequest $request, Lesson $lesson, #[CurrentUser] User $admin): AdminLessonResource
    {
        return AdminLessonResource::detailed($this->media->saveCaptions($lesson, $request->upload(), $admin), $this->inspector);
    }

    public function destroyVideo(Lesson $lesson, #[CurrentUser] User $admin): AdminLessonResource
    {
        return AdminLessonResource::detailed($this->media->removeVideo($lesson, $admin), $this->inspector);
    }

    public function destroyCaptions(Lesson $lesson, #[CurrentUser] User $admin): AdminLessonResource
    {
        return AdminLessonResource::detailed($this->media->removeCaptions($lesson, $admin), $this->inspector);
    }

    /**
     * Rovid eletu, alairt URL az elonezethez. Nem publikalt leckehez is jo (az admin latja),
     * es a hozzaferesi szabalyt nem kerüli meg: csak admin kerheti.
     *
     * @throws LessonVideoMissing
     */
    public function preview(Lesson $lesson): JsonResponse
    {
        if (! $this->inspector->inspect($lesson->video_path)->exists) {
            throw new LessonVideoMissing;
        }

        $expiresAt = CarbonImmutable::now()->addMinutes(Config::integer('catalog.video.url_ttl_minutes'));
        $signed = static fn (string $route): string => url(URL::temporarySignedRoute($route, $expiresAt, ['lesson' => $lesson->id], absolute: false));
        $hasCaptions = $this->inspector->inspect($lesson->captions_path)->exists;

        return response()->json(['data' => [
            'url' => $signed('api.lessons.video.preview'),
            'captions_url' => $hasCaptions ? $signed('api.lessons.captions.preview') : null,
            'expires_at' => $expiresAt->toIso8601String(),
        ]])->header('Cache-Control', 'no-store');
    }

    /** Csak ervenyes alairassal (signed:relative); a <video> nem tud Bearer tokent kuldeni. */
    public function previewStream(Lesson $lesson, MediaResponse $response): Response
    {
        return $response->video($lesson->video_path);
    }

    /** Az elonezet felirata, ugyanazzal az alairassal. */
    public function previewCaptions(Lesson $lesson, MediaResponse $response): Response
    {
        return $response->captions($lesson->captions_path);
    }
}
