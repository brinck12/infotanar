<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Catalog;

use App\Services\Files\UploadedFileInspector;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\UploadedFile;

/**
 * Ertekelolap-proba: a kiprobalando fajl a `file` mezoben. Elhagyhato, akkor
 * a feladat feltoltott mintamegoldasa (`sample_solution`) fut le. A
 * kiterjesztest es a tartalmat itt is az UploadedFileInspector ellenorzi.
 */
final class RubricCheckRequest extends FormRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'file' => ['sometimes', 'file', 'max:'.intdiv(UploadedFileInspector::maxBytesFor('document'), 1024)],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'file.file' => __('filetasks.upload_failed'),
            'file.uploaded' => __('filetasks.upload_failed'),
            'file.max' => __('filetasks.too_large_for_request'),
        ];
    }

    /** A kiprobalando fajl, vagy null, ha a mintamegoldast kell hasznalni. */
    public function upload(): ?UploadedFile
    {
        $file = $this->file('file');

        return $file instanceof UploadedFile ? $file : null;
    }
}
