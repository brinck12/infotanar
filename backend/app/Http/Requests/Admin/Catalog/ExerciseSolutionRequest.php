<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Catalog;

use App\Models\Exercise;
use Closure;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

/**
 * Egy nyelv mintamegoldasa. A nyelv az URL-ben van, es a feladat engedelyezett
 * nyelvei kozul valo kell legyen: mas nyelvre nem tarolunk megoldast.
 */
final class ExerciseSolutionRequest extends FormRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'source_code' => ['required', 'string', 'max:65535'],
            'explanation' => ['nullable', 'string', 'max:20000'],
        ];
    }

    /** @return list<Closure(Validator): void> */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $exercise = $this->route('exercise');

                if ($exercise instanceof Exercise && ! in_array($this->language(), $exercise->allowed_languages ?? [], true)) {
                    $validator->errors()->add('language', __('admin.solution_language_not_allowed', ['language' => $this->language()]));
                }
            },
        ];
    }

    public function language(): string
    {
        return (string) $this->route('language');
    }

    public function sourceCode(): string
    {
        return $this->string('source_code')->toString();
    }

    public function explanation(): ?string
    {
        return $this->filled('explanation') ? $this->string('explanation')->toString() : null;
    }
}
