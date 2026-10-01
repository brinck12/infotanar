<?php

declare(strict_types=1);

namespace App\Services\Execution;

use App\Enums\Verdict;
use App\Exceptions\Judge0Exception;
use App\Models\Exercise;
use App\Services\Constraints\ConstraintChecker;
use App\Services\Judge0Service;

/**
 * Egyetlen futtatas a diak sajat bemenetevel (#153), "Saját bemenet".
 *
 * Nincs elvart kimenet, ezert nincs osszevetes es nincs "sikeres/hibas": a
 * valasz csak azt adja vissza, amit a program kiirt. A feladat tesztesetei
 * (a rejtettek sem) ebben az utban egyaltalan nem szerepelnek. A kodszabalyok
 * itt is ervenyesek, mint a normal futtatasnal.
 *
 * A valasz egyetlen `kind: custom` elemet tartalmaz a `results` listaban.
 *
 * @phpstan-import-type Judge0Run from Judge0Service
 */
final readonly class CustomInputRunner
{
    public function __construct(
        private Judge0Service $judge0,
        private ConstraintChecker $constraints,
    ) {}

    public function run(Exercise $exercise, string $language, string $sourceCode, string $stdin): EvaluationResult
    {
        $violations = $this->constraints->violations($exercise->constraints, $language, $sourceCode);
        if ($violations !== []) {
            return EvaluationResult::constraintViolation($violations);
        }

        try {
            $run = $this->judge0->run($language, $sourceCode, $stdin);
        } catch (Judge0Exception $e) {
            return $this->resultOf(Verdict::SystemError, $this->errorEntry($e->getMessage()));
        }

        $verdict = Verdict::forCustomRun($run['status_id']);

        return $this->resultOf($verdict, $this->entry($verdict, $run));
    }

    /**
     * @param  Judge0Run  $run
     * @return array<string, mixed>
     */
    private function entry(Verdict $verdict, array $run): array
    {
        return [
            'kind' => 'custom',
            'verdict' => $verdict->value,
            'verdict_label' => $verdict->label(),
            'time' => $run['time'],
            'exit_code' => $run['exit_code'],
            'judge_status' => $run['status'],
            'stdout' => $run['stdout'],
            'stderr' => $run['stderr'],
            'compile_output' => $run['compile_output'],
        ];
    }

    /** @return array<string, mixed> */
    private function errorEntry(string $message): array
    {
        return [
            'kind' => 'custom',
            'verdict' => Verdict::SystemError->value,
            'verdict_label' => Verdict::SystemError->label(),
            'time' => null,
            'exit_code' => null,
            'judge_status' => __('execution.error_status_label'),
            'stdout' => '',
            'stderr' => '',
            'compile_output' => '',
            'error' => $message,
        ];
    }

    /**
     * A `status` a regi osszegzes jelentesevel: `completed` = lefutott,
     * `failed` = nem futott le rendben (fordítási/futásidejű hiba, időkorlát),
     * `error` = rendszerhiba.
     *
     * @param  array<string, mixed>  $entry
     */
    private function resultOf(Verdict $verdict, array $entry): EvaluationResult
    {
        $status = match ($verdict) {
            Verdict::Completed => 'completed',
            Verdict::SystemError => 'error',
            default => 'failed',
        };

        return new EvaluationResult($status, $verdict, [$entry]);
    }
}
