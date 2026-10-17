<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\ExerciseKind;
use App\Enums\Verdict;
use App\Exceptions\Judge0Exception;
use App\Models\Exercise;
use App\Models\TestCase;
use App\Services\Constraints\ConstraintChecker;
use App\Services\Execution\Comparison\ComparisonSettings;
use App\Services\Execution\Comparison\OutputComparators;
use App\Services\Execution\EvaluationResult;
use App\Services\Execution\ExecutionLimitResolver;
use App\Services\Execution\Files\ExecutionFileArchive;
use App\Services\Execution\Files\ExecutionFilesUnavailable;
use App\Services\Execution\HiddenResultRedactor;
use App\Services\Execution\Sql\SqlProgram;
use App\Services\Execution\Sql\SqlResultComparator;
use App\Services\Execution\Subtasks\SubtaskDefinition;
use App\Services\Execution\Subtasks\SubtaskScore;
use App\Services\Execution\Subtasks\SubtaskScorer;
use App\Services\Execution\Subtasks\TestCaseOutput;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Log;

/**
 * Egy megoldas lefuttatasa tesztesetenkent, es az eredmeny osszevetese az
 * elvart kimenettel.
 *
 * Az osszevetest szandekosan itt vegezzuk, nem a Judge0 expected_output
 * mezojevel: igy tudjuk, pontosan mi jott ki, es informativ hibat adhatunk.
 * Az osszevetes modja a feladat beallitasa (ComparisonSettings); beallitas es
 * reszfeladatok nelkul a regi, soronkenti egyezes.
 *
 * Ha a kodfeladatnak pontozott reszfeladatai vannak (`spec.subtasks`), az
 * eredmeny reszfeladatonkenti pontokat is tartalmaz (SubtaskScorer), es a
 * megoldas csak akkor elfogadott, ha minden reszfeladat teljes pontot er.
 *
 * @phpstan-import-type Judge0Run from Judge0Service
 */
final readonly class SolutionEvaluator
{
    private const SQL = 'sql';

    public function __construct(
        private Judge0Service $judge0,
        private SqlResultComparator $sqlComparator,
        private HiddenResultRedactor $redactor,
        private ConstraintChecker $constraints,
        private ExecutionLimitResolver $limits,
        private OutputComparators $comparators,
        private ExecutionFileArchive $files,
        private SubtaskScorer $subtaskScorer,
    ) {}

    /** @param Collection<int, TestCase> $testCases */
    public function evaluate(Exercise $exercise, string $language, string $sourceCode, Collection $testCases): EvaluationResult
    {
        $subtasks = $this->subtasksOf($exercise, $language);

        // A kodszabalyokat a sandbox elott ellenorizzuk: a szabalyserto megoldas
        // el sem jut a Judge0-ig (idot es futtatasi kapacitast sporol).
        $violations = $this->constraints->violations($exercise->constraints, $language, $sourceCode);
        if ($violations !== []) {
            return EvaluationResult::constraintViolation($violations, $this->maxScore($subtasks, $testCases->count()));
        }

        $results = [];
        $verdicts = [];
        $outputs = [];

        $limits = $this->limits->forExercise($exercise, $language);
        $comparison = ComparisonSettings::resolve($exercise->comparison, $subtasks !== []);

        // Az adatfajlok leiroi egyetlen lekerdezessel jonnek, nem tesztesetenkent.
        // SQL-nel nincs fajl: ott a teszteset bemenete az adatkeszlet-szkript.
        $attachments = $language === self::SQL ? null : $this->files->attachmentsOf($exercise);

        // Egy tesztesetre ennyi ido (mp) jut: a futas faliora-korlatja, plusz a sorban allas es a forditas.
        $perTestCase = (int) ceil($limits->wallTimeSeconds()) + Config::integer('judge0.test_overhead');

        // A teljes kiertekeles idokerete a tesztesetek szamaval no, de felso korlatja
        // van, hogy a kliens a sajat timeoutja elott mindig valaszt kapjon.
        $deadline = microtime(true) + min(
            $perTestCase * max(1, $testCases->count()),
            Config::integer('judge0.evaluation_deadline'),
        );

        foreach ($testCases as $testCase) {
            $remaining = (int) floor($deadline - microtime(true));

            try {
                if ($remaining < 1) {
                    throw Judge0Exception::timedOut();
                }

                $timeout = min($remaining, $perTestCase);

                // SQL-nel a teszteset bemenete az adatkeszlet-szkript, ami a programba kerul.
                $run = $attachments === null
                    ? $this->judge0->run(SqlProgram::RUNNER_LANGUAGE, SqlProgram::build((string) $testCase->stdin, $sourceCode), null, $limits, $timeout)
                    : $this->judge0->run($language, $sourceCode, $testCase->stdin, $limits, $timeout, $this->files->for($attachments, $testCase));
            } catch (Judge0Exception $e) {
                $verdicts[] = Verdict::SystemError;
                $results[] = $this->errorResult($testCase, $e->getMessage());

                // Ha a futtato szolgaltatas elerhetetlen, a tobbi teszteset
                // sem fog menni - nincs ertelme tovabb probalkozni.
                break;
            } catch (ExecutionFilesUnavailable $e) {
                // A feladat adatfajlja hianyzik vagy nem olvashato: ez sem a megoldas hibaja.
                Log::error('Execution: exercise data files are unavailable.', ['exercise_id' => $exercise->id, 'error' => $e->getMessage()]);

                $verdicts[] = Verdict::SystemError;
                $results[] = $this->errorResult($testCase, __('execution.files_unavailable'));

                break;
            }

            // SQL-nel a sajat osszevetes dont (SqlResultComparator); a tobbi nyelvnel a feladat beallitasa.
            if ($language === self::SQL) {
                $verdict = $this->sqlVerdict($run, $testCase, $exercise->sql_order_sensitive);
                $difference = null;
            } else {
                $compared = $this->comparators->compare($run['stdout'], $testCase->expected_stdout, $comparison);
                $verdict = Verdict::fromJudge0($run['status_id'], $compared->matches);
                $difference = $verdict === Verdict::WrongAnswer ? $compared->difference : null;
                $outputs[] = new TestCaseOutput($testCase->is_hidden, $run['stdout'], $testCase->expected_stdout);
            }

            $verdicts[] = $verdict;
            $results[] = $this->buildResult($testCase, $run, $verdict, $difference);

            // Forditasi hiba minden tesztesetnel ugyanaz lenne: a tobbit nem futtatjuk.
            if ($verdict === Verdict::CompilationError) {
                break;
            }
        }

        $overall = $this->overallVerdict($verdicts);
        $scores = $subtasks === [] ? null : $this->scoreSubtasks($subtasks, $outputs, $overall, $comparison);

        // Reszfeladatos feladat csak teljes pontszammal elfogadott (pl. ha az
        // elvart kimenetbol hianyzik egy resz, a tesztesetek onmagukban atmennenek).
        if ($scores !== null && $overall === Verdict::Accepted && $this->points($scores) < $this->maxScore($subtasks, 0)) {
            $overall = Verdict::WrongAnswer;
        }

        return new EvaluationResult(
            $this->legacyStatus($overall, $verdicts),
            $overall,
            $this->redactor->redact($results),
            subtasks: $scores,
            score: $scores === null ? count(array_keys($verdicts, Verdict::Accepted, true)) : $this->points($scores),
            maxScore: $this->maxScore($subtasks, $testCases->count()),
        );
    }

    /**
     * A feladat pontozott reszfeladatai. Csak kodfeladatnal ertelmezett: az
     * SQL-feladat `spec.subtasks` listaja tajekoztato (lekerdezesnevek), nem pontoz.
     *
     * @return list<SubtaskDefinition>
     */
    private function subtasksOf(Exercise $exercise, string $language): array
    {
        return $exercise->kind === ExerciseKind::Code && $language !== self::SQL
            ? SubtaskDefinition::listFrom($exercise->spec)
            : [];
    }

    /**
     * Forditasi vagy rendszerhibanal a megoldas nem futott ertekelhetoen: senki
     * nem kap pontot. Minden mas esetben (futasideju hiba, idotullepes is) az
     * addig kiirt reszek pontot erhetnek.
     *
     * @param  non-empty-list<SubtaskDefinition>  $subtasks
     * @param  list<TestCaseOutput>  $outputs
     * @return non-empty-list<SubtaskScore>
     */
    private function scoreSubtasks(array $subtasks, array $outputs, Verdict $overall, ComparisonSettings $comparison): array
    {
        return in_array($overall, [Verdict::SystemError, Verdict::CompilationError], true)
            ? $this->subtaskScorer->unscored($subtasks)
            : $this->subtaskScorer->score($subtasks, $outputs, $comparison);
    }

    /** @param list<SubtaskScore> $scores */
    private function points(array $scores): int
    {
        return array_sum(array_map(static fn (SubtaskScore $score): int => $score->points, $scores));
    }

    /**
     * Az elerheto pontszam: reszfeladatos feladatnal a reszek pontjainak
     * osszege, kulonben a kiertekeles teszteseteinek szama.
     *
     * @param  list<SubtaskDefinition>  $subtasks
     */
    private function maxScore(array $subtasks, int $testCaseCount): int
    {
        return $subtasks === []
            ? $testCaseCount
            : array_sum(array_map(static fn (SubtaskDefinition $subtask): int => $subtask->points, $subtasks));
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
     * @param  Judge0Run  $run
     * @param  string|null  $difference  az elso elteres leirasa (elemenkenti osszevetesnel, hibas kimenetnel)
     * @return array<string, mixed>
     */
    private function buildResult(TestCase $testCase, array $run, Verdict $verdict, ?string $difference): array
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

        // A rejtett tesztesetek adatait az evaluate() vegen a HiddenResultRedactor
        // tavolitja el, egyetlen helyen, fehérlistaval.
        return $result + [
            'stdin' => (string) $testCase->stdin,
            'stdout' => $run['stdout'],
            'expected' => $testCase->expected_stdout,
            'stderr' => $run['stderr'],
            'compile_output' => $run['compile_output'],
            // Az elvart kimenetbol idez: a `difference` nincs a redactor fehérlistajan, igy
            // rejtett tesztesetnel nem megy ki. Ha nincs mit mondani, a kulcs is kimarad.
        ] + ($difference === null ? [] : ['difference' => $difference]);
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
