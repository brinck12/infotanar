<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Exams;

use App\Enums\ExamPartKey;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** Vizsgarész hozzáadása (frontend `ExamPartPayload`). A feladat fajtáját az Action ellenőrzi. */
final class ExamPartRequest extends FormRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'key' => ['required', Rule::enum(ExamPartKey::class)],
            'name' => ['required', 'string', 'max:255'],
            'exercise_id' => ['present', 'nullable', 'integer', Rule::exists('exercises', 'id')],
            'points' => ['required', 'integer', 'between:0,300'],
            'minutes' => ['required', 'integer', 'between:0,600'],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function partAttributes(): array
    {
        return [
            'key' => $this->enum('key', ExamPartKey::class),
            'name' => $this->string('name')->toString(),
            'exercise_id' => $this->filled('exercise_id') ? $this->integer('exercise_id') : null,
            'points' => $this->integer('points'),
            'minutes' => $this->integer('minutes'),
        ];
    }
}
