<?php

declare(strict_types=1);

namespace App\Services\Catalog;

use App\Enums\AttachmentRole;
use App\Enums\Verdict;
use App\Exceptions\FileTasks\EvaluatorBusy;
use App\Models\Exercise;
use App\Models\TestCase;
use App\Services\Execution\EvaluationResult;
use App\Services\FileTasks\EvaluationGate;
use App\Services\FileTasks\FileEvaluator;
use App\Services\SolutionEvaluator;
use Illuminate\Support\Collection;

/**
 * Egy feladat lefuttatasa a sajat mintamegoldasan: a tartalom-ellenorzes
 * (`catalog:verify`), az admin "Kiprobalas mintamegoldassal" gombja es a
 * publikalasi kapu kozos alapja. Semmit nem tarol, felhasznalo nincs.
 *
 *  - szerkesztos feladat (code, sql): minden teszteset (a rejtettek is) lefut a
 *    SolutionEvaluator-on, nyelvenkent a mintamegoldassal, pont ugy, mint egy beadas;
 *  - feltoltos feladat: a feltoltott `sample_solution` fajl az ertekelolapon,
 *    es a teljes pontszamot kell elernie (ugyanaz az ertekelo, mint a CheckRubric);
 *  - bongeszos feladat: a szerver nem ertekeli, kimarad.
 */
final readonly class ExerciseVerifier
{
    public function __construct(
        private SolutionEvaluator $solutions,
        private FileEvaluator $files,
        private EvaluationGate $gate,
    ) {}

    /**
     * @param  bool  $negative  szerkesztos feladatnal az ures programnak is el kell buknia (tul engedekeny elvart kimenet ellen)
     */
    public function verify(Exercise $exercise, bool $negative = false): ExerciseVerification
    {
        if ($exercise->kind->isEditorBased()) {
            return $this->verifyEditor($exercise, $negative);
        }

        if ($exercise->kind->isUpload()) {
            return $this->verifyUpload($exercise);
        }

        return new ExerciseVerification($exercise, ExerciseVerification::SKIPPED, __('catalog.verify.browser_only'));
    }

    /**
     * A mintamegoldas nyelvei: csak az engedelyezett nyelvek, ures forras nelkul.
     *
     * @return array<string, string>
     */
    public static function solutionsOf(Exercise $exercise): array
    {
        $allowed = $exercise->allowed_languages ?? [];
        $solutions = [];

        foreach ($exercise->sample_solutions ?? [] as $language => $source) {
            // A tarolt JSON-ban null is lehet (ures mezo): a tipus a validalas utan igaz, de itt nem bizunk benne.
            if (in_array($language, $allowed, true) && is_string($source) && trim($source) !== '') {
                $solutions[$language] = $source;
            }
        }

        return $solutions;
    }

    private function verifyEditor(Exercise $exercise, bool $negative): ExerciseVerification
    {
        $solutions = self::solutionsOf($exercise);

        if ($solutions === []) {
            return new ExerciseVerification($exercise, ExerciseVerification::FAILED, __('catalog.verify.sample_missing'));
        }

        // Minden engedelyezett nyelvhez kell mintamegoldas, kulonben a hianyzo nyelv ellenorizetlen maradna.
        $missing = array_values(array_diff($exercise->allowed_languages ?? [], array_keys($solutions)));

        if ($missing !== []) {
            return new ExerciseVerification($exercise, ExerciseVerification::FAILED, __('catalog.verify.sample_language_missing', ['languages' => implode(', ', $missing)]));
        }

        $testCases = $exercise->testCases()->get();

        if ($testCases->isEmpty()) {
            return new ExerciseVerification($exercise, ExerciseVerification::FAILED, __('catalog.verify.no_test_cases'));
        }

        $runs = [];
        $passed = true;

        foreach ($solutions as $language => $source) {
            $result = $this->solutions->evaluate($exercise, $language, $source, $testCases);
            $run = $this->run($language, $result);
            $passed = $passed && $run['passed'];
            $runs[] = $run;
        }

        if ($passed && $negative) {
            $lenient = $this->lenientLanguages($exercise, array_keys($solutions), $testCases);

            if ($lenient !== []) {
                return new ExerciseVerification($exercise, ExerciseVerification::FAILED, __('catalog.verify.negative_passed', ['languages' => implode(', ', $lenient)]), $runs);
            }
        }

        return new ExerciseVerification($exercise, $passed ? ExerciseVerification::PASSED : ExerciseVerification::FAILED, runs: $runs);
    }

    /**
     * Azok a nyelvek, amelyeken az ures program is minden tesztesetet teljesit.
     *
     * @param  list<string>  $languages
     * @param  Collection<int, TestCase>  $testCases
     * @return list<string>
     */
    private function lenientLanguages(Exercise $exercise, array $languages, Collection $testCases): array
    {
        $lenient = [];

        foreach ($languages as $language) {
            if ($this->run($language, $this->solutions->evaluate($exercise, $language, '', $testCases))['passed']) {
                $lenient[] = $language;
            }
        }

        return $lenient;
    }

    private function verifyUpload(Exercise $exercise): ExerciseVerification
    {
        $sample = $exercise->attachments()->ofRole(AttachmentRole::SampleSolution)->first()?->storedFile();

        if ($sample === null) {
            return new ExerciseVerification($exercise, ExerciseVerification::FAILED, __('catalog.verify.sample_missing'));
        }

        if (! $exercise->rubricItems()->exists()) {
            return new ExerciseVerification($exercise, ExerciseVerification::FAILED, __('catalog.verify.rubric_empty'));
        }

        try {
            $evaluation = $this->gate->run(fn () => $this->files->evaluate($exercise, $sample));
        } catch (EvaluatorBusy) {
            return new ExerciseVerification($exercise, ExerciseVerification::FAILED, __('catalog.verify.busy'));
        }

        if (! $evaluation->isEvaluated()) {
            return new ExerciseVerification($exercise, ExerciseVerification::FAILED, __('catalog.verify.file_failed', ['error' => (string) $evaluation->error]));
        }

        // Teljes pontszam kell; a kezzel pontozott pontokat a gep nem tudja eldonteni, azok nem szamitanak hibanak.
        $snapshot = $evaluation->result;

        if ($snapshot->maxScore() === 0 || $snapshot->score() + $snapshot->pendingManualPoints() < $snapshot->maxScore()) {
            return new ExerciseVerification($exercise, ExerciseVerification::FAILED, __('catalog.verify.rubric_failed', ['score' => $evaluation->score(), 'max' => $evaluation->maxScore()]));
        }

        return new ExerciseVerification($exercise, ExerciseVerification::PASSED);
    }

    /** @return array{language: string, passed: bool, verdict: string, verdict_label: string, score: int, max_score: int, tests: list<array{test_case_id: int|null, hidden: bool, passed: bool, verdict: string, verdict_label: string, time: string|null, message: string|null}>} */
    private function run(string $language, EvaluationResult $result): array
    {
        $tests = [];

        foreach ($result->results as $row) {
            $tests[] = [
                'test_case_id' => is_int($row['test_case_id'] ?? null) ? $row['test_case_id'] : null,
                'hidden' => ($row['hidden'] ?? false) === true,
                'passed' => ($row['passed'] ?? false) === true,
                'verdict' => is_string($row['verdict'] ?? null) ? $row['verdict'] : Verdict::SystemError->value,
                'verdict_label' => is_string($row['verdict_label'] ?? null) ? $row['verdict_label'] : '',
                'time' => is_scalar($row['time'] ?? null) ? (string) $row['time'] : null,
                // Rejtett tesztesetnel a HiddenResultRedactor mar kiszurte; ami itt van, az lathato.
                'message' => $this->message($row),
            ];
        }

        $passed = $result->verdict === Verdict::Accepted && $tests !== [] && ! in_array(false, array_column($tests, 'passed'), true);

        return [
            'language' => $language,
            'passed' => $passed,
            'verdict' => $result->verdict->value,
            'verdict_label' => $result->verdict->label(),
            'score' => $result->score,
            'max_score' => $result->maxScore,
            'tests' => $tests,
        ];
    }

    /**
     * A sikertelen teszteset rovid oka (kimeneti elteres, hibauzenet); sikeresnel null.
     *
     * @param  array<string, mixed>  $row
     */
    private function message(array $row): ?string
    {
        if (($row['passed'] ?? false) === true) {
            return null;
        }

        foreach (['difference', 'stderr', 'compile_output'] as $key) {
            $value = $row[$key] ?? null;

            if (is_string($value) && trim($value) !== '') {
                return mb_substr(trim($value), 0, 300);
            }
        }

        return null;
    }
}
