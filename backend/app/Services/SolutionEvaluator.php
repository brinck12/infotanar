<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\Verdict;
use App\Exceptions\Judge0Exception;
use App\Models\Exercise;
use App\Models\TestCase;
use App\Services\Execution\EvaluationResult;
use App\Services\Execution\Sql\SqlProgram;
use App\Services\Execution\Sql\SqlResultComparator;
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
    private const SQL = 'sql';

    public function __construct(
        private Judge0Service $judge0,
        private SqlResultComparator $sqlComparator,
    ) {}

    /** @param Collection<int, TestCase> $testCases */
    public function evaluate(Exercise $exercise, string $language, string $sourceCode, Collection $testCases): EvaluationResult
    {
        $results = [];
        $verdicts = [];

        // A teljes kiertekelesnek (minden tesztesetnek egyutt) felso korlatja van,
        // hogy a kliens a sajat timeoutja elott mindig valaszt kapjon.
        $deadline = microtime(true) + Config::integer('judge0.evaluation_deadline');

        foreach ($testCases as $testCase) {
            $remaining = (int) floor($deadline - microtime(true));

            try {
                if ($remaining < 1) {
                    throw Judge0Exception::timedOut();
                }

                // SQL-nel a teszteset bemenete az adatkeszlet-szkript, ami a programba kerul.
                $run = $language === self::SQL
                    ? $this->judge0->run($language, SqlProgram::build((string) $testCase->stdin, $sourceCode), null, $remaining)
                    : $this->judge0->run($language, $sourceCode, $testCase->stdin, $remaining);
            } catch (Judge0Exception $e) {
                $verdicts[] = Verdict::SystemError;
                $results[] = $this->errorResult($testCase, $e->getMessage());

                // Ha a futtato szolgaltatas elerhetetlen, a tobbi teszteset
                // sem fog menni - nincs ertelme tovabb probalkozni.
                break;
            }

            $verdict = $language === self::SQL
                ? $this->sqlVerdict($run, $testCase, $exercise->sql_order_sensitive)
                : Verdict::fromJudge0($run['status_id'], $this->outputMatches($run['stdout'], $testCase->expected_stdout));
            $verdicts[] = $verdict;
            $results[] = $this->buildResult($testCase, $run, $verdict);

            // Forditasi hiba minden tesztesetnel ugyanaz lenne: a tobbit nem futtatjuk.
            if ($verdict === Verdict::CompilationError) {
                break;
            }
        }

        $overall = $this->overallVerdict($verdicts);

        return new EvaluationResult($this->legacyStatus($overall, $verdicts), $overall, $results);
    }

    /**
     * A sqlite3 `.bail on` mellett hibanal "Error: ..." uzenettel es nem nulla
     * kilepesi koddal all le (Judge0: Runtime Error). SQL-nel ez szintaktikai /
     * szemantikai hiba a lekerdezesben, ezert fordítasi hibakent jelezzuk.
     *
     * @param  Judge0Run  $run
     */
    private function sqlVerdict(array $run, TestCase $testCase, bool $orderSensitive): Verdict
    {
        if (str_contains($run['stderr'], 'Error:')) {
            return Verdict::CompilationError;
        }

        return Verdict::fromJudge0(
            $run['status_id'],
            $this->sqlComparator->matches($run['stdout'], $testCase->expected_stdout, $orderSensitive),
        );
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
    private function buildResult(TestCase $testCase, array $run, Verdict $verdict): array
    {
        $result = [
            'test_case_id' => $testCase->id,
            'hidden' => $testCase->is_hidden,
            'passed' => $verdict === Verdict::Accepted,
            'verdict' => $verdict->value,
            'verdict_label' => $verdict->label(),
            'time' => $run['time'],
            'exit_code' => $run['exit_code'],
            'judge_status' => $run['status'],
        ];

        // Rejtett teszteseteknel csak az allapot megy vissza, kimenet nelkul -
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
            'verdict' => Verdict::SystemError->value,
            'verdict_label' => Verdict::SystemError->label(),
            'time' => null,
            'exit_code' => null,
            'judge_status' => __('execution.error_status_label'),
            'error' => $message,
        ];
    }

    /**
     * Rendszerhiba felulir mindent (nem a megoldas hibaja); kulonben az
     * elso nem elfogadott teszteset allapota a dontő (sorrendben ez az, amit
     * a diak eloszor javitani fog).
     *
     * @param  list<Verdict>  $verdicts
     */
    private function overallVerdict(array $verdicts): Verdict
    {
        if ($verdicts === [] || in_array(Verdict::SystemError, $verdicts, true)) {
            return Verdict::SystemError;
        }

        foreach ($verdicts as $verdict) {
            if ($verdict !== Verdict::Accepted) {
                return $verdict;
            }
        }

        return Verdict::Accepted;
    }

    /**
     * A regi, harom erteku osszegzes (passed/failed/error), valtozatlan
     * jelentessel: a kliensek es a tarolt beadasok erre epulnek.
     *
     * @param  list<Verdict>  $verdicts
     */
    private function legacyStatus(Verdict $overall, array $verdicts): string
    {
        return match (true) {
            $overall === Verdict::SystemError, $verdicts === [] => 'error',
            $overall === Verdict::Accepted => 'passed',
            default => 'failed',
        };
    }
}
