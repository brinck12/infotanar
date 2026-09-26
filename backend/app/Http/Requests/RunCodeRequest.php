<?php

namespace App\Http\Requests;

use App\Models\Task;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class RunCodeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'task_id' => ['required', 'integer', 'exists:tasks,id'],
            'language' => ['required', 'string', 'in:'.implode(',', array_keys(config('judge0.languages')))],
            'source_code' => ['required', 'string', 'max:65535'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'task_id.required' => 'A feladat azonosítója kötelező.',
            'task_id.exists' => 'A megadott feladat nem létezik.',
            'language.required' => 'A programozási nyelv megadása kötelező.',
            'language.in' => 'Ez a programozási nyelv nem támogatott.',
            'source_code.required' => 'A forráskód nem lehet üres.',
            'source_code.max' => 'A forráskód túl hosszú (legfeljebb 65535 karakter).',
        ];
    }

    /** A feladat sajat maga korlatozhatja, mely nyelveken oldhato meg. */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if ($validator->errors()->isNotEmpty()) {
                    return;
                }

                $task = Task::find($this->integer('task_id'));

                if ($task && ! in_array($this->string('language')->toString(), $task->allowed_languages ?? [], true)) {
                    $validator->errors()->add('language', 'Ez a feladat nem oldható meg ezen a nyelven.');
                }
            },
        ];
    }
}
