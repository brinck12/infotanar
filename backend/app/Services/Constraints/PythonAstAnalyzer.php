<?php

declare(strict_types=1);

namespace App\Services\Constraints;

use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Log;
use Symfony\Component\Process\Exception\ProcessTimedOutException;
use Symfony\Component\Process\Process;
use Throwable;

/**
 * A Python forraskod szerkezetenek kinyerese kulso folyamatban, a kod
 * futtatasa nelkul. Hiba (szintaktikai hiba, tul osszetett kod, hianyzo
 * Python) eseten null: a hivo ilyenkor nem ellenoriz szabalyt - a
 * szintaktikai hibat ugyis a Judge0 jelzi forditasi hibakent.
 */
final class PythonAstAnalyzer
{
    public function analyze(string $sourceCode): ?CodeAnalysis
    {
        $process = new Process(
            [Config::string('constraints.python_binary'), resource_path('python/constraint_analyzer.py')],
            timeout: Config::integer('constraints.timeout_seconds'),
        );
        $process->setInput($sourceCode);

        try {
            $process->run();
        } catch (ProcessTimedOutException) {
            Log::warning('Constraint analyzer timed out.');

            return null;
        } catch (Throwable $e) {
            Log::error('Constraint analyzer could not start.', ['error' => $e->getMessage()]);

            return null;
        }

        if (! $process->isSuccessful()) {
            Log::error('Constraint analyzer failed.', ['exit_code' => $process->getExitCode(), 'stderr' => mb_substr($process->getErrorOutput(), 0, 500)]);

            return null;
        }

        $data = json_decode($process->getOutput(), true);

        if (! is_array($data) || ($data['ok'] ?? false) !== true) {
            return null;
        }

        return new CodeAnalysis(
            forLoop: ($data['for_loop'] ?? false) === true,
            whileLoop: ($data['while_loop'] ?? false) === true,
            recursion: ($data['recursion'] ?? false) === true,
            builtinCalls: self::strings($data['builtin_calls'] ?? []),
            methodCalls: self::strings($data['method_calls'] ?? []),
            dynamicCalls: ($data['dynamic_calls'] ?? false) === true,
        );
    }

    /** @return list<string> */
    private static function strings(mixed $value): array
    {
        return is_array($value) ? array_values(array_filter($value, is_string(...))) : [];
    }
}
