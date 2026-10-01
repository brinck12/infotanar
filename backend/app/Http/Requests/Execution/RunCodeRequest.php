<?php

declare(strict_types=1);

namespace App\Http\Requests\Execution;

use App\Models\Exercise;
use App\Models\User;
use App\Services\Execution\Sql\SqlProgram;
use Closure;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Config;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

final class RunCodeRequest extends FormRequest
{
    private ?Exercise $exercise = null;

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'task_id' => ['required', 'integer', 'exists:exercises,id'],
            'language' => ['required', 'string', Rule::in(array_keys(Config::array('judge0.languages')))],
            'source_code' => ['required', 'string', 'max:65535'],
            // Csak a megadasa szamit (lasd hasCustomInput()); az ures bemenet is ervenyes.
            'stdin' => ['sometimes', 'nullable', 'string', 'max:65536'],
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

                if (! in_array($this->language(), $this->exercise()->allowed_languages ?? [], true)) {
                    $validator->errors()->add('language', __('execution.language_not_allowed'));

                    return;
                }

                // SQL-nel a "bemenet" a teszteset adatkeszlet-szkriptje: sajat bemenet ertelmetlen.
                if ($this->language() === 'sql' && $this->hasCustomInput()) {
                    $validator->errors()->add('stdin', __('execution.custom_input_not_for_sql'));

                    return;
                }

                if ($this->language() === 'sql' && SqlProgram::containsDotCommand($this->sourceCode())) {
                    $validator->errors()->add('source_code', __('execution.sql_dot_command'));
                }
            },
        ];
    }

    /** A v1 API mezoje `task_id`. Nem publikalt feladat 404, mintha nem is letezne. */
    public function exercise(): Exercise
    {
        return $this->exercise ??= Exercise::query()->published()->with('lesson')->findOrFail($this->integer('task_id'));
    }

    /** A vegpont nyilvanos; ervenyes Bearer token eseten a felhasznalo, kulonben null. */
    public function optionalUser(): ?User
    {
        $user = $this->user('sanctum');

        return $user instanceof User ? $user : null;
    }

    public function language(): string
    {
        return $this->string('language')->toString();
    }

    public function sourceCode(): string
    {
        return $this->string('source_code')->toString();
    }

    /**
     * "Sajat bemenettel futtatas": a `stdin` kulcs megadasa jelzi, az erteke nem.
     * A Laravel az ures sztringet null-ra alakitja, de az ures bemenet is ertelmes
     * (pl. egy program, ami nem olvas), ezert a kulcs jelenletet nezzuk.
     */
    public function hasCustomInput(): bool
    {
        return $this->exists('stdin');
    }

    public function customInput(): string
    {
        return $this->string('stdin')->toString();
    }
}
