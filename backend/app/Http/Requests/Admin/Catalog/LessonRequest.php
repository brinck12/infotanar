<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Catalog;

use App\Models\Lesson;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** POST: minden kotelezo mezo kell; PATCH: csak a megadott mezok valtoznak (module_id = athelyezes). */
final class LessonRequest extends FormRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        $required = $this->isMethod('POST') ? 'required' : 'sometimes';
        $lesson = $this->route('lesson');
        $moduleId = $this->integer('module_id') ?: ($lesson instanceof Lesson ? $lesson->module_id : null);

        return [
            'module_id' => [$required, 'integer', 'exists:modules,id'],
            // A slug modulon belul egyedi (a regi URL-ek miatt nem globalisan).
            'slug' => [$required, 'string', 'max:100', 'alpha_dash:ascii', Rule::unique('lessons', 'slug')
                ->where('module_id', $moduleId)
                ->ignore($lesson instanceof Lesson ? $lesson->id : null)],
            'title' => [$required, 'string', 'max:255'],
            'content' => ['sometimes', 'nullable', 'string', 'max:100000'],
            // Relativ utvonal a privat video-taroloban; utvonal-bejaras tiltva.
            'video_path' => ['sometimes', 'nullable', 'string', 'max:500', 'not_regex:/(^\/|\.\.|\\\\)/'],
            'is_free' => ['sometimes', 'boolean'],
            'is_published' => ['sometimes', 'boolean'],
        ];
    }
}
