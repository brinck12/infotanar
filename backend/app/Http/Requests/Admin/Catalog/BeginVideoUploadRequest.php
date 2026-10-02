<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Catalog;

use Illuminate\Foundation\Http\FormRequest;

/** Egy videofeltoltes megnyitasa (#158): a kliens megadja a fajl nevet es teljes meretet. */
final class BeginVideoUploadRequest extends FormRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'filename' => ['required', 'string', 'max:255'],
            // A maximalis meretet a feltoltes-kezelo ellenorzi (konfigbol), magyar uzenettel.
            'size' => ['required', 'integer', 'min:1'],
        ];
    }

    public function filename(): string
    {
        return $this->string('filename')->toString();
    }

    public function size(): int
    {
        return $this->integer('size');
    }
}
