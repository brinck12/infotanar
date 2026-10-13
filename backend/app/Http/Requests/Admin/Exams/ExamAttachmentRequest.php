<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Exams;

use App\Services\Files\UploadedFileInspector;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\UploadedFile;
use LogicException;

/**
 * A vizsga forrásfájljainak zipje (multipart `file`). A szerep mindig
 * `source_zip`: egy esetleg küldött `role` mezőt figyelmen kívül hagyunk. A
 * tartalmat és a pontos korlátot a ManageAttachment ellenőrzi.
 */
final class ExamAttachmentRequest extends FormRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'file' => ['required', 'file', 'max:'.max(1, UploadedFileInspector::maxKilobytesFor(['.zip']))],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'file.file' => __('filetasks.upload_failed'),
            'file.uploaded' => __('filetasks.upload_failed'),
        ];
    }

    public function upload(): UploadedFile
    {
        $file = $this->file('file');

        return $file instanceof UploadedFile ? $file : throw new LogicException('A file mezo a validacio utan mindig egy feltoltott fajl.');
    }
}
