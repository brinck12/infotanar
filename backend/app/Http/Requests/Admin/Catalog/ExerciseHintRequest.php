<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Catalog;

use Illuminate\Foundation\Http\FormRequest;

/** Egy tipp szovege (Markdown). Letrehozasnal es modositasnal is kotelezo. */
final class ExerciseHintRequest extends FormRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'body' => ['required', 'string', 'max:5000'],
        ];
    }

    public function body(): string
    {
        return $this->string('body')->toString();
    }
}
