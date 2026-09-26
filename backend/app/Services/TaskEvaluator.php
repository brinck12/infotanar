<?php

namespace App\Services;

use App\Exceptions\Judge0Exception;
use App\Models\Task;
use Illuminate\Support\Collection;

/**
 * Egy feladat megoldasanak lefuttatasa tesztesetenkent, es az eredmeny
 * osszevetese az elvart kimenettel.
 *
 * Az osszevetest szandekosan itt vegezzuk, nem a Judge0 expected_output
 * mezojevel: igy tudjuk, pontosan mi jott ki, es informativ hibat adhatunk.
 */
class TaskEvaluator
{
    public function __construct(private readonly Judge0Service $judge0)
    {
    }

    /**
     * @param  Collection<int, \App\Models\TestCase>  $testCases
     * @return array{status:string,results:array<int, array<string, mixed>>}
     */
    public function evaluate(Task $task, string $language, string $sourceCode, Collection $testCases): array
    {
        $results = [];
        $allPassed = true;
        $hadError = false;

        foreach ($testCases as $testCase) {
            try {
                $run = $this->judge0->run($language, $sourceCode, $testCase->stdin);
            } catch (Judge0Exception $e) {
                $hadError = true;
                $results[] = $this->errorResult($testCase, $e->getMessage());

                // Ha a futtato szolgaltatas elerhetetlen, a tobbi teszteset
                // sem fog menni - nincs ertelme tovabb probalkozni.
                break;
            }

            $passed = $this->outputMatches($run['stdout'], $testCase->expected_stdout);

            if (! $passed) {
                $allPassed = false;
            }

            $results[] = $this->buildResult($testCase, $run, $passed);
        }

        return [
            'status' => $this->overallStatus($hadError, $allPassed, count($results)),
            'results' => $results,
        ];
    }

    /**
     * Kimenet-osszevetes. A sorvegi whitespace-t es a zaro ureslsorokat
     * normalizaljuk, mert ezek erettsegi-feladatoknal nem relevans elteresek.
     */
    public function outputMatches(string $actual, string $expected): bool
    {
        return $this->normalize($actual) === $this->normalize($expected);
    }

    private function normalize(string $value): string
    {
        $value = str_replace("\r\n", "\n", $value);
        $lines = explode("\n", $value);
        $lines = array_map(static fn (string $line): string => rtrim($line), $lines);

        // Zaro ures sorok levagasa.
        while ($lines !== [] && end($lines) === '') {
            array_pop($lines);
        }

        return implode("\n", $lines);
    }

    /** @return array<string, mixed> */
    private function buildResult(\App\Models\TestCase $testCase, array $run, bool $passed): array
    {
        $result = [
            'test_case_id' => $testCase->id,
            'hidden' => $testCase->is_hidden,
            'passed' => $passed,
            'time' => $run['time'],
            'exit_code' => $run['exit_code'],
            'judge_status' => $run['status'],
        ];

        // Rejtett teszteseteknel csak PASS/FAIL megy vissza, kimenet nelkul -
        // kulonben visszafejthetok lennenek a rejtett bemenetek.
        if ($testCase->is_hidden) {
            return $result;
        }

        return $result + [
            'stdin' => (string) $testCase->stdin,
            'stdout' => $run['stdout'],
            'expected' => $testCase->expected_stdout,
            'stderr' => $run['stderr'],
            'compile_output' => $run['compile_output'],
        ];
    }

    /** @return array<string, mixed> */
    private function errorResult(\App\Models\TestCase $testCase, string $message): array
    {
        return [
            'test_case_id' => $testCase->id,
            'hidden' => $testCase->is_hidden,
            'passed' => false,
            'time' => null,
            'exit_code' => null,
            'judge_status' => 'Hiba',
            'error' => $message,
        ];
    }

    private function overallStatus(bool $hadError, bool $allPassed, int $resultCount): string
    {
        if ($hadError) {
            return 'error';
        }

        if ($resultCount === 0) {
            return 'error';
        }

        return $allPassed ? 'passed' : 'failed';
    }
}
