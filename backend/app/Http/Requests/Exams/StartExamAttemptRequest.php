<?php

declare(strict_types=1);

namespace App\Http\Requests\Exams;

use App\Enums\ExamMode;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use LogicException;

/** Vizsgaprobalkozas inditasa: `{mode: "exam" | "practice"}`. */
final class StartExamAttemptRequest extends FormRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'mode' => ['required', Rule::enum(ExamMode::class)],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'mode.required' => __('exams.mode_invalid'),
            'mode.enum' => __('exams.mode_invalid'),
        ];
    }

    public function mode(): ExamMode
    {
        return $this->enum('mode', ExamMode::class) ?? throw new LogicException('A mode mezo a validacio utan mindig ervenyes.');
    }
}
