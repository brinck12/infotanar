<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Catalog;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Config;

/**
 * Felirat feltoltese (#158): egyetlen .vtt fajl. A WEBVTT-fejlecet az ManageLessonMedia
 * ellenorzi, mert ahhoz a tartalmat kell olvasni.
 */
final class CaptionsUploadRequest extends FormRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'file' => ['required', 'file', 'extensions:vtt', 'max:'.Config::integer('catalog.captions.max_size_kb')],
        ];
    }

    public function upload(): UploadedFile
    {
        $upload = $this->file('file');
        assert($upload instanceof UploadedFile, 'A "file" mezo validalt, igy mindig feltoltott fajl.');

        return $upload;
    }
}
