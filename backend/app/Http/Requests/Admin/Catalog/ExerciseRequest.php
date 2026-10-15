<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin\Catalog;

use App\Enums\ExerciseKind;
use App\Models\Exercise;
use App\Rules\ValidConstraintSet;
use App\Services\Catalog\Spec\ExerciseSpec;
use App\Services\Catalog\Spec\KnownKeys;
use App\Services\Catalog\Spec\SpecValue;
use App\Services\Execution\ExecutionLimits;
use Closure;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Config;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/**
 * POST: minden kotelezo mezo kell; PUT/PATCH: csak a megadott mezok valtoznak
 * (lesson_id = athelyezes).
 *
 * A fajta (`kind`) elhagyhato, igy a regi admin urlap valtozatlanul mukodik:
 * letrehozaskor a nyelvekbol kovetkezik (csak SQL -> `sql`, kulonben `code`),
 * modositaskor a tarolt fajta marad. A tobbi fajtafuggo mezo ehhez az
 * "ervenyes fajtahoz" igazodik:
 *  - `allowed_languages`: szerkesztos fajtanal kotelezo, masnal ures;
 *  - `spec`: fajtankent mas alak (ExerciseSpec);
 *  - `comparison`: csak `code` fajtanal.
 *
 * A menteshez az exerciseAttributes() adja a kesz attributumokat.
 */
final class ExerciseRequest extends FormRequest
{
    private const COMPARISON_MODES = ['exact', 'tokens', 'numeric'];

    private const COMPARISON_FLAGS = ['case_insensitive', 'ignore_accents', 'ignore_blank_lines'];

    private const COMPARISON_TOLERANCES = ['abs_tol', 'rel_tol'];

    /** @return array<string, mixed> */
    public function rules(): array
    {
        $required = $this->isMethod('POST') ? 'required' : 'sometimes';
        $languages = array_keys(Config::array('judge0.languages'));
        $kind = $this->kind();

        return [
            'lesson_id' => [$required, 'integer', 'exists:lessons,id'],
            'kind' => ['sometimes', Rule::enum(ExerciseKind::class)],
            'title' => [$required, 'string', 'max:255'],
            'description' => [$required, 'string', 'max:100000'],
            'level' => [$required, 'string', Rule::in(['kozep', 'emelt'])],
            'difficulty' => [$required, 'integer', 'between:1,5'],
            'allowed_languages' => $kind->isEditorBased()
                ? [Rule::requiredIf($this->needsLanguages()), 'array', 'min:1']
                : ['sometimes', 'nullable', 'array'],
            'allowed_languages.*' => ['string', 'distinct', Rule::in($languages)],
            'starter_code' => ['sometimes', 'nullable', 'array'],
            'starter_code.*' => ['nullable', 'string', 'max:20000'],
            'sample_solutions' => ['sometimes', 'nullable', 'array'],
            'sample_solutions.*' => ['nullable', 'string', 'max:50000'],
            'constraints' => ['sometimes', 'nullable', 'array', new ValidConstraintSet],
            'sql_order_sensitive' => ['sometimes', 'boolean'],
            // Ures (null) = a globalis alapertek ervenyes.
            'time_limit_ms' => ['sometimes', 'nullable', 'integer', 'between:'.ExecutionLimits::MIN_TIME_LIMIT_MS.','.ExecutionLimits::MAX_TIME_LIMIT_MS],
            'memory_limit_kb' => ['sometimes', 'nullable', 'integer', 'between:'.ExecutionLimits::MIN_MEMORY_LIMIT_KB.','.ExecutionLimits::MAX_MEMORY_LIMIT_KB],
            'is_published' => ['sometimes', 'boolean'],
            ...resolve(ExerciseSpec::class)->rules($kind, $this->input(ExerciseSpec::FIELD)),
            // Ures (null) = a mai, soronkenti egyezes.
            'comparison' => ['sometimes', 'nullable', 'array', new KnownKeys(['mode', ...self::COMPARISON_FLAGS, ...self::COMPARISON_TOLERANCES])],
            'comparison.mode' => ['required_with:comparison', 'string', Rule::in(self::COMPARISON_MODES)],
            'comparison.case_insensitive' => ['sometimes', 'boolean'],
            'comparison.ignore_accents' => ['sometimes', 'boolean'],
            'comparison.ignore_blank_lines' => ['sometimes', 'boolean'],
            // Szamok egyezesenek turese (`numeric` mod): abszolut es relativ.
            'comparison.abs_tol' => ['sometimes', 'nullable', 'numeric', 'between:0,1000'],
            'comparison.rel_tol' => ['sometimes', 'nullable', 'numeric', 'between:0,1'],
        ];
    }

    /** @return list<Closure(Validator): void> */
    public function after(): array
    {
        return [
            $this->checkLanguages(...),
            $this->checkStarterCode(...),
            $this->checkSampleSolutions(...),
            $this->checkComparison(...),
            $this->checkSpec(...),
        ];
    }

    /**
     * Az alap magyar uzenetek kozul hianyzo szabalyokhoz.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return $this->translations('catalog.validation');
    }

    /** @return array<string, string> */
    public function attributes(): array
    {
        return $this->translations('catalog.attributes');
    }

    /**
     * A feladat fajtaja a keres utan: a kuldott ertek, modositasnal enelkul a
     * tarolt, letrehozasnal a nyelvekbol kovetkezo. Ervenytelen `kind` eseten
     * (amit a szabaly ugyis elutasit) szinten az alapertek.
     */
    public function kind(): ExerciseKind
    {
        $requested = $this->input('kind');
        $kind = is_string($requested) ? ExerciseKind::tryFrom($requested) : null;

        if ($kind !== null) {
            return $kind;
        }

        $stored = $this->exercise();

        if ($stored !== null) {
            return $stored->kind;
        }

        // Ugyanaz a szabaly, mint amellyel a meglevo feladatok fajtat kaptak (csak SQL nyelv -> sql).
        return $this->input('allowed_languages') === ['sql'] ? ExerciseKind::Sql : ExerciseKind::Code;
    }

    /**
     * A mentheto attributumok: az ellenorzott mezok, a fajtahoz igazitva.
     *
     * Fajtavaltaskor a regi fajtahoz tartozo adat nem maradhat meg: a `spec`
     * (ha a keres nem kuld ujat) es a nem kodfeladat `comparison`-ja torlodik,
     * a nem szerkesztos fajta pedig elveszti a nyelveit es a kiindulo kodjat.
     *
     * @return array<string, mixed>
     */
    public function exerciseAttributes(): array
    {
        $stored = $this->exercise();
        $kind = $this->kind();
        $kindChanges = $stored !== null && $stored->kind !== $kind;

        $attributes = SpecValue::map($this->safe()->except(['kind', ExerciseSpec::FIELD, 'comparison']));

        if ($stored === null || $kindChanges) {
            $attributes['kind'] = $kind;
        }

        if (! $kind->isEditorBased() && ($stored === null || $kindChanges || $this->has('allowed_languages'))) {
            $attributes['allowed_languages'] = [];
        }

        if (! $kind->isEditorBased() && $kindChanges) {
            $attributes['starter_code'] = [];
            $attributes['sample_solutions'] = [];
        }

        if ($this->has(ExerciseSpec::FIELD) || $kindChanges) {
            $spec = $this->input(ExerciseSpec::FIELD);
            $attributes[ExerciseSpec::FIELD] = is_array($spec)
                ? resolve(ExerciseSpec::class)->normalise($kind, $spec, $kindChanges ? null : $stored?->spec)
                : null;
        }

        if ($this->has('comparison') || ($kindChanges && $kind !== ExerciseKind::Code)) {
            $attributes['comparison'] = $this->comparison();
        }

        return $attributes;
    }

    /** Szerkesztos fajtanal kell nyelv: letrehozaskor mindig, modositaskor akkor, ha a feladatnak eddig nem volt. */
    private function needsLanguages(): bool
    {
        return $this->isMethod('POST') || $this->storedLanguages() === [];
    }

    /** @return list<string> */
    private function storedLanguages(): array
    {
        $stored = $this->exercise();

        return $stored === null ? [] : $stored->allowed_languages ?? [];
    }

    /**
     * A feladat nyelvei a keres utan: nem szerkesztos fajtanal nincs, kulonben
     * a kuldott lista, enelkul a tarolt.
     *
     * @return list<string>
     */
    private function languages(): array
    {
        if (! $this->kind()->isEditorBased()) {
            return [];
        }

        return $this->has('allowed_languages')
            ? SpecValue::strings($this->input('allowed_languages'))
            : $this->storedLanguages();
    }

    private function checkLanguages(Validator $validator): void
    {
        $kind = $this->kind();

        if (! $kind->isEditorBased() && SpecValue::items($this->input('allowed_languages')) !== []) {
            $validator->errors()->add('allowed_languages', __('catalog.languages_not_allowed'));
        }

        if ($kind === ExerciseKind::Sql && $this->languages() !== ['sql']) {
            $validator->errors()->add('allowed_languages', __('catalog.sql_languages'));
        }
    }

    /** A kiindulo kod csak a feladat nyelvein adhato meg (nem szerkesztos fajtanal egyaltalan nem). */
    private function checkStarterCode(Validator $validator): void
    {
        $allowed = $this->languages();

        foreach (array_keys(SpecValue::map($this->input('starter_code'))) as $language) {
            if (! in_array($language, $allowed, true)) {
                $validator->errors()->add('starter_code', __('admin.starter_code_language', ['language' => (string) $language]));
            }
        }
    }

    /** A mintamegoldas is csak a feladat nyelvein adhato meg. */
    private function checkSampleSolutions(Validator $validator): void
    {
        $allowed = $this->languages();

        foreach (array_keys(SpecValue::map($this->input('sample_solutions'))) as $language) {
            if (! in_array($language, $allowed, true)) {
                $validator->errors()->add('sample_solutions', __('catalog.sample_solution_language', ['language' => (string) $language]));
            }
        }
    }

    private function checkComparison(Validator $validator): void
    {
        if ($this->kind() !== ExerciseKind::Code && SpecValue::map($this->input('comparison')) !== []) {
            $validator->errors()->add('comparison', __('catalog.comparison_only_code'));
        }
    }

    /** A spec mezok kozotti szabalyai csak akkor ertelmesek, ha az alakja mar rendben van. */
    private function checkSpec(Validator $validator): void
    {
        if ($validator->errors()->isNotEmpty()) {
            return;
        }

        foreach (resolve(ExerciseSpec::class)->violations($this->kind(), $this->input(ExerciseSpec::FIELD)) as $field => $message) {
            $validator->errors()->add($field, $message);
        }
    }

    /**
     * A mentendo osszehasonlitasi beallitas teljes alakban; null, ha nincs megadva.
     *
     * @return array{mode: string, case_insensitive: bool, ignore_accents: bool, ignore_blank_lines: bool, abs_tol: int|float|null, rel_tol: int|float|null}|null
     */
    private function comparison(): ?array
    {
        $comparison = SpecValue::map($this->input('comparison'));

        if ($comparison === [] || $this->kind() !== ExerciseKind::Code) {
            return null;
        }

        return [
            'mode' => SpecValue::string($comparison['mode'] ?? null, self::COMPARISON_MODES[0]),
            'case_insensitive' => SpecValue::boolean($comparison['case_insensitive'] ?? null),
            'ignore_accents' => SpecValue::boolean($comparison['ignore_accents'] ?? null),
            'ignore_blank_lines' => SpecValue::boolean($comparison['ignore_blank_lines'] ?? null),
            'abs_tol' => SpecValue::number($comparison['abs_tol'] ?? null),
            'rel_tol' => SpecValue::number($comparison['rel_tol'] ?? null),
        ];
    }

    /** A modositott feladat; letrehozasnal null. */
    private function exercise(): ?Exercise
    {
        $exercise = $this->route('exercise');

        return $exercise instanceof Exercise ? $exercise : null;
    }

    /**
     * @return array<string, string>
     */
    private function translations(string $key): array
    {
        return array_filter(SpecValue::map(trans($key)), is_string(...));
    }
}
