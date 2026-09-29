<?php

declare(strict_types=1);

namespace App\Services;

use App\Exceptions\Judge0Exception;
use App\Models\TestCase;
use App\Services\Execution\EvaluationResult;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Config;

/**
 * Egy megoldas lefuttatasa tesztesetenkent, es az eredmeny osszevetese az
 * elvart kimenettel.
 *
 * Az osszevetest szandekosan itt vegezzuk, nem a Judge0 expected_output
 * mezojevel: igy tudjuk, pontosan mi jott ki, es informativ hibat adhatunk.
 *
 * @phpstan-import-type Judge0Run from Judge0Service
 */
final readonly class SolutionEvaluator
{
    public function __construct(private Judge0Service $judge0) {}

    /** @param Collection<int, TestCase> $testCases */
    public function evaluate(string $language, string $sourceCode, Collection $testCases): EvaluationResult
    {
        $results = [];
        $allPassed = true;
        $hadError = false;

        // A teljes kiertekelesnek (minden tesztesetnek egyutt) felso korlatja van,
        // hogy a kliens a sajat timeoutja elott mindig valaszt kapjon.
        $deadline = microtime(true) + Config::integer('judge0.evaluation_deadline');

        foreach ($testCases as $testCase) {
            $remaining = (int) floor($deadline - microtime(true));

            try {
                if ($remaining < 1) {
                    throw Judge0Exception::timedOut();
                }

                $run = $this->judge0->run($language, $sourceCode, $testCase->stdin, $remaining);
            } catch (Judge0Exception $e) {
                $hadError = true;
                $results[] = $this->errorResult($testCase, $e->getMessage());

                // Ha a futtato szolgaltatas elerhetetlen, a tobbi teszteset
                // sem fog menni - nincs ertelme tovabb probalkozni.
                break;
            }

            $passed = $this->outputMatches($run['stdout'], $testCase->expected_stdout);
            $allPassed = $allPassed && $passed;
            $results[] = $this->buildResult($testCase, $run, $passed);
        }

        return new EvaluationResult($this->overallStatus($hadError, $allPassed, count($results)), $results);
    }

    /**
     * Kimenet-osszevetes. A sorvegi whitespace-t es a zaro ures sorokat
     * normalizaljuk, mert ezek erettsegi-feladatoknal nem relevans elteresek.
     */
    public function outputMatches(string $actual, string $expected): bool
    {
        return $this->normalize($actual) === $this->normalize($expected);
    }

    private function normalize(string $value): string
    {
        $lines = array_map(rtrim(...), explode("\n", str_replace("\r\n", "\n", $value)));

        while ($lines !== [] && end($lines) === '') {
            array_pop($lines);
        }

        return implode("\n", $lines);
    }

    /**
     * @param  Judge0Run  $run
     * @return array<string, mixed>
     */
    private function buildResult(TestCase $testCase, array $run, bool $passed): array
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
    private function errorResult(TestCase $testCase, string $message): array
    {
        return [
            'test_case_id' => $testCase->id,
            'hidden' => $testCase->is_hidden,
            'passed' => false,
            'time' => null,
            'exit_code' => null,
            'judge_status' => __('execution.error_status_label'),
            'error' => $message,
        ];
    }

    private function overallStatus(bool $hadError, bool $allPassed, int $resultCount): string
    {
        if ($hadError || $resultCount === 0) {
            return 'error';
        }

        return $allPassed ? 'passed' : 'failed';
    }
}
