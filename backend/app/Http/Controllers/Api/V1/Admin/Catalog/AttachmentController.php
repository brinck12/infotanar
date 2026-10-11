<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin\Catalog;

use App\Actions\Admin\Catalog\ManageAttachment;
use App\Exceptions\Catalog\AttachmentLimitReached;
use App\Exceptions\Catalog\InvalidAttachment;
use App\Exceptions\FileTasks\MacroEnabledFile;
use App\Exceptions\FileTasks\UnsupportedUpload;
use App\Exceptions\FileTasks\UploadTooLarge;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Catalog\AttachmentRequest;
use App\Http\Resources\Admin\AdminAttachmentResource;
use App\Models\Attachment;
use App\Models\Exercise;
use App\Models\User;
use Illuminate\Container\Attributes\CurrentUser;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

/**
 * Feladat csatolt fajljai az admin feluleten: forrasfajlok, tesztesetenkenti
 * bemenetek, mintakep, mintamegoldas. A torles kozvetlenul a csatolmanyra
 * megy, igy ugyanaz a vegpont a vizsga forras-zipjet is torolni tudja.
 */
final class AttachmentController extends Controller
{
    public function __construct(private readonly ManageAttachment $manage) {}

    public function index(Exercise $exercise): AnonymousResourceCollection
    {
        return AdminAttachmentResource::collection($exercise->attachments()->orderBy('id')->get());
    }

    /**
     * Azonos nevu fajl (egypeldanyos szerepnel barmilyen nevu) a regit csereli.
     *
     * @throws InvalidAttachment
     * @throws AttachmentLimitReached
     * @throws UnsupportedUpload|UploadTooLarge|MacroEnabledFile
     */
    public function store(AttachmentRequest $request, Exercise $exercise, #[CurrentUser] User $admin): JsonResponse
    {
        $attachment = $this->manage->store(
            $exercise,
            $request->role(),
            $request->upload(),
            $admin,
            $request->name(),
            $request->testCase(),
        );

        return AdminAttachmentResource::make($attachment)->response()->setStatusCode(JsonResponse::HTTP_CREATED);
    }

    public function destroy(Attachment $attachment, #[CurrentUser] User $admin): Response
    {
        $this->manage->delete($attachment, $admin);

        return response()->noContent();
    }
}
