<?php

declare(strict_types=1);

namespace App\Http\Requests\Execution;

use App\Models\Task;
use Closure;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Config;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

final class RunCodeRequest extends FormRequest
{
    private ?Task $task = null;

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'task_id' => ['required', 'integer', 'exists:tasks,id'],
            'language' => ['required', 'string', Rule::in(array_keys(Config::array('judge0.languages')))],
            'source_code' => ['required', 'string', 'max:65535'],
        ];
    }

    /**
     * A feladat maga is korlatozhatja, mely nyelveken oldhato meg.
     *
     * @return list<Closure(Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if ($validator->errors()->isNotEmpty()) {
                    return;
                }

                if (! in_array($this->language(), $this->task()->allowed_languages ?? [], true)) {
                    $validator->errors()->add('language', __('execution.language_not_allowed'));
                }
            },
        ];
    }

    /** Nem publikalt feladat 404, mintha nem is letezne. */
    public function task(): Task
    {
        return $this->task ??= Task::query()->published()->findOrFail($this->integer('task_id'));
    }

    public function language(): string
    {
        return $this->string('language')->toString();
    }

    public function sourceCode(): string
    {
        return $this->string('source_code')->toString();
    }
}
