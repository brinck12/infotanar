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
            'task_id.required' => 'A feladat azonositoja kotelezo.',
            'task_id.exists' => 'A megadott feladat nem letezik.',
            'language.required' => 'A programozasi nyelv megadasa kotelezo.',
            'language.in' => 'Ez a programozasi nyelv nem tamogatott.',
            'source_code.required' => 'A forraskod nem lehet ures.',
            'source_code.max' => 'A forraskod tul hosszu (legfeljebb 65535 karakter).',
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
                    $validator->errors()->add('language', 'Ez a feladat nem oldhato meg ezen a nyelven.');
                }
            },
        ];
    }
}
