<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin\Catalog;

use App\Actions\Admin\Catalog\ManageLessonMedia;
use App\Exceptions\Catalog\InvalidVideoUpload;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Catalog\BeginVideoUploadRequest;
use App\Http\Resources\Admin\AdminLessonResource;
use App\Http\Resources\Admin\LessonUploadResource;
use App\Models\Lesson;
use App\Models\LessonUpload;
use App\Models\User;
use App\Services\Catalog\Media\LessonMediaInspector;
use Illuminate\Container\Attributes\CurrentUser;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

/**
 * Darabokban feltoltott leckevideo (#158): megnyitas, darabok, allapot (a folytatashoz),
 * lezaras, megszakitas.
 */
final class LessonVideoUploadController extends Controller
{
    public function __construct(private readonly ManageLessonMedia $media) {}

    public function store(BeginVideoUploadRequest $request, Lesson $lesson, #[CurrentUser] User $admin): JsonResponse
    {
        $upload = $this->media->beginVideoUpload($lesson, $admin, $request->filename(), $request->size());

        return LessonUploadResource::make($upload)->response()->setStatusCode(JsonResponse::HTTP_CREATED);
    }

    /** A megerkezett darabok: ebbol folytathato a megszakadt feltoltes. */
    public function show(LessonUpload $upload): LessonUploadResource
    {
        return new LessonUploadResource($upload, $this->media->receivedVideoParts($upload));
    }

    /**
     * Egy darab nyers torzse (nem multipart): nincs PHP-feltoltesi limit, es a
     * kliens ugyanazt a darabot biztonsagosan ujrakuldheti.
     *
     * @throws InvalidVideoUpload
     */
    public function part(Request $request, LessonUpload $upload, int $part): Response
    {
        $this->media->receiveVideoPart($upload, $part, $request->getContent());

        return response()->noContent();
    }

    /** @throws InvalidVideoUpload */
    public function complete(LessonUpload $upload, LessonMediaInspector $inspector, #[CurrentUser] User $admin): AdminLessonResource
    {
        return AdminLessonResource::detailed($this->media->completeVideoUpload($upload, $admin), $inspector);
    }

    public function destroy(LessonUpload $upload): Response
    {
        $this->media->abortVideoUpload($upload);

        return response()->noContent();
    }
}
