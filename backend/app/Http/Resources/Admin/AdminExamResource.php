<?php

declare(strict_types=1);

namespace App\Http\Resources\Admin;

use App\Models\Attachment;
use App\Models\Exam;
use App\Services\Files\AttachmentUrls;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Egy vizsga a szerkesztőnek (frontend `AdminExam`). A `session` és a
 * `files[].id` a frontend tervezett alakjához képest kiegészítés: a
 * csatolmány törléséhez az azonosító kell.
 *
 * A hívónak be kell töltenie: `parts.exercise` (PartReadiness összesítésekkel)
 * és `attachments`. A fájlok aláírt admin URL-t kapnak.
 *
 * @mixin Exam
 */
final class AdminExamResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $urls = resolve(AttachmentUrls::class);

        return [
            'id' => $this->id,
            'session' => $this->session,
            'title' => $this->title,
            'level' => $this->level,
            'minutes' => $this->minutes,
            'points' => $this->points,
            'is_published' => $this->is_published,
            'timed_mode' => $this->timed_mode,
            'parts' => AdminExamPartResource::collection($this->parts),
            'files' => $this->attachments->map(static fn (Attachment $attachment): array => [
                'id' => $attachment->id,
                'name' => $attachment->name,
                'size' => $attachment->size,
                'url' => $urls->forAdmin($attachment),
            ])->all(),
        ];
    }
}
