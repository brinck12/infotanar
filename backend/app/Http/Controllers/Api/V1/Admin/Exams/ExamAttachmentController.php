<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin\Exams;

use App\Actions\Admin\Catalog\ManageAttachment;
use App\Enums\AttachmentRole;
use App\Exceptions\Catalog\AttachmentLimitReached;
use App\Exceptions\Catalog\InvalidAttachment;
use App\Exceptions\FileTasks\MacroEnabledFile;
use App\Exceptions\FileTasks\UnsupportedUpload;
use App\Exceptions\FileTasks\UploadTooLarge;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Exams\ExamAttachmentRequest;
use App\Http\Resources\Admin\AdminAttachmentResource;
use App\Models\Exam;
use App\Models\User;
use Illuminate\Container\Attributes\CurrentUser;
use Illuminate\Http\JsonResponse;

/**
 * A vizsga forrásfájljainak zipje. Egy van: az új feltöltés a régit cseréli.
 * A törlés a közös `DELETE /admin/attachments/{attachment}` végponton megy.
 */
final class ExamAttachmentController extends Controller
{
    public function __construct(private readonly ManageAttachment $manage) {}

    /**
     * @throws InvalidAttachment
     * @throws AttachmentLimitReached
     * @throws UnsupportedUpload|UploadTooLarge|MacroEnabledFile
     */
    public function store(ExamAttachmentRequest $request, Exam $exam, #[CurrentUser] User $admin): JsonResponse
    {
        $attachment = $this->manage->store($exam, AttachmentRole::SourceZip, $request->upload(), $admin);

        return AdminAttachmentResource::make($attachment)->response()->setStatusCode(JsonResponse::HTTP_CREATED);
    }
}
