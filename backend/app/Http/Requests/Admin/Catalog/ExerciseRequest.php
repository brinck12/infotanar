<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Catalog;

use App\Http\Requests\Concerns\ValidatesComparisonSettings;
use App\Models\Exercise;
use App\Rules\ValidConstraintSet;
use Closure;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Config;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/** POST: minden kotelezo mezo kell; PATCH: csak a megadott mezok valtoznak (lesson_id = athelyezes). */
final class ExerciseRequest extends FormRequest
{
    use ValidatesComparisonSettings;

    /** @return array<string, mixed> */
    public function rules(): array
    {
        $required = $this->isMethod('POST') ? 'required' : 'sometimes';
        $languages = array_keys(Config::array('judge0.languages'));

        return [
            'lesson_id' => [$required, 'integer', 'exists:lessons,id'],
            'title' => [$required, 'string', 'max:255'],
            'description' => [$required, 'string', 'max:100000'],
            'level' => [$required, 'string', Rule::in(['kozep', 'emelt'])],
            'difficulty' => [$required, 'integer', 'between:1,5'],
            'allowed_languages' => [$required, 'array', 'min:1'],
            'allowed_languages.*' => ['string', 'distinct', Rule::in($languages)],
            'starter_code' => ['sometimes', 'nullable', 'array'],
            'starter_code.*' => ['nullable', 'string', 'max:20000'],
            'constraints' => ['sometimes', 'nullable', 'array', new ValidConstraintSet],
            ...$this->comparisonRules(),
            'sql_order_sensitive' => ['sometimes', 'boolean'],
            'is_published' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * A kiindulo kod csak engedelyezett nyelvre adhato meg.
     *
     * @return list<Closure(Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $starter = $this->input('starter_code');
                // PATCH-nel, ha a nyelvek nem valtoznak, a tarolt lista a mervado.
                $exercise = $this->route('exercise');
                $allowed = $this->input('allowed_languages', $exercise instanceof Exercise ? $exercise->allowed_languages : null);

                if (! is_array($starter) || ! is_array($allowed)) {
                    return;
                }

                foreach (array_keys($starter) as $language) {
                    if (! in_array($language, $allowed, true)) {
                        $validator->errors()->add('starter_code', __('admin.starter_code_language', ['language' => (string) $language]));
                    }
                }
            },
        ];
    }
}
