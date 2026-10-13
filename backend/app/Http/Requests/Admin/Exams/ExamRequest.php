<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Exams;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;

/**
 * Vizsga létrehozása és módosítása (frontend `ExamPayload`). A `session`
 * elhagyható: létrehozáskor a következő májusi vagy októberi időszak, módosításkor
 * változatlan marad. A közzétételi szabályokat az Action ellenőrzi.
 */
final class ExamRequest extends FormRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'level' => ['required', 'string', Rule::in(['kozep', 'emelt'])],
            'minutes' => ['required', 'integer', 'between:1,600'],
            'points' => ['required', 'integer', 'between:1,300'],
            'is_published' => ['required', 'boolean'],
            'timed_mode' => ['required', 'boolean'],
            'session' => ['sometimes', 'nullable', 'string', 'regex:/^\d{4}-(05|10)$/'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'session.regex' => __('exams.session_invalid'),
        ];
    }

    /**
     * A mentendő mezők. A `session` csak akkor szerepel, ha meg lett adva.
     *
     * @return array<string, mixed>
     */
    public function examAttributes(): array
    {
        $attributes = [
            'title' => $this->string('title')->toString(),
            'level' => $this->string('level')->toString(),
            'minutes' => $this->integer('minutes'),
            'points' => $this->integer('points'),
            'is_published' => $this->boolean('is_published'),
            'timed_mode' => $this->boolean('timed_mode'),
        ];

        $session = $this->input('session');

        if (is_string($session) && $session !== '') {
            $attributes['session'] = $session;
        }

        return $attributes;
    }

    /** Az alapértelmezett időszak létrehozáskor: a soron következő (vagy folyó) május/október. */
    public static function defaultSession(): string
    {
        $now = Carbon::now();

        return $now->year.'-'.($now->month <= 5 ? '05' : '10');
    }
}
