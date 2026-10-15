<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\Exercise;
use App\Services\Catalog\ExerciseVerification;
use App\Services\Catalog\ExerciseVerifier;
use Illuminate\Console\Command;
use Illuminate\Database\Eloquent\Builder;

/**
 * Tartalom-ellenorzo kapu: minden publikalt feladat mintamegoldasat lefuttatja
 * a sajat tesztjein ugyanazzal a SolutionEvaluator-ral, mint a beadasokat
 * (valodi Judge0 kell: helyben SSH-alagut, lasd docs/runbooks/katalogus-ellenorzes.md).
 * Barmilyen nem-atmeno feladatnal nem nulla kilepesi kodot ad.
 *
 *   php artisan catalog:verify
 *   php artisan catalog:verify --track=python-alapok --json
 *   php artisan catalog:verify --exercise=12     (piszkozat is ellenorizheto)
 */
final class VerifyCatalogCommand extends Command
{
    protected $signature = 'catalog:verify
        {--exercise= : Csak ez a feladat (azonosító); piszkozat is lehet}
        {--track= : Csak ennek a tanulási útnak a feladatai (azonosító vagy slug)}
        {--json : Géppel olvasható kimenet}';

    protected $description = 'A publikált feladatok mintamegoldásának lefuttatása a saját teszteseteiken (valódi Judge0 kell)';

    public function handle(ExerciseVerifier $verifier): int
    {
        $exercises = $this->exercises();

        if ($exercises === []) {
            $this->error('Nincs ellenőrizendő feladat.');

            return self::FAILURE;
        }

        $verifications = array_map($verifier->verify(...), $exercises);
        $failures = array_filter($verifications, static fn (ExerciseVerification $v): bool => $v->isFailure());

        if ($this->option('json') === true) {
            $this->line((string) json_encode([
                'ok' => $failures === [],
                'checked' => count($verifications),
                'failed' => count($failures),
                'exercises' => array_map(static fn (ExerciseVerification $v): array => $v->toArray(), $verifications),
            ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT));

            return $failures === [] ? self::SUCCESS : self::FAILURE;
        }

        foreach ($verifications as $verification) {
            $this->report($verification);
        }

        $skipped = count(array_filter($verifications, static fn (ExerciseVerification $v): bool => $v->status === ExerciseVerification::SKIPPED));
        $summary = sprintf('%d feladat ellenőrizve, %d hibás, %d kihagyva.', count($verifications), count($failures), $skipped);

        if ($failures === []) {
            $this->info($summary);

            return self::SUCCESS;
        }

        $this->error($summary);

        return self::FAILURE;
    }

    /** @return list<Exercise> */
    private function exercises(): array
    {
        $exercise = $this->option('exercise');
        $track = $this->option('track');

        $query = Exercise::query()->orderBy('lesson_id')->orderBy('position');

        if (is_string($exercise) && $exercise !== '') {
            $query->whereKey((int) $exercise);
        } else {
            $query->published();
        }

        if (is_string($track) && $track !== '') {
            $query->whereHas('lesson.module.track', static fn (Builder $tracks) => ctype_digit($track)
                ? $tracks->whereKey((int) $track)
                : $tracks->where('slug', $track));
        }

        return array_values($query->get()->all());
    }

    private function report(ExerciseVerification $verification): void
    {
        $exercise = $verification->exercise;
        $label = sprintf('#%d %s', $exercise->id, $exercise->title);

        if ($verification->status === ExerciseVerification::PASSED) {
            $this->line("OK     {$label}");

            return;
        }

        if ($verification->status === ExerciseVerification::SKIPPED) {
            $this->line("KIHAGY {$label}: {$verification->message}");

            return;
        }

        $this->error("HIBA   {$label}".($verification->message === null ? '' : ": {$verification->message}"));

        foreach ($verification->runs as $run) {
            $this->line(sprintf('       %s: %s (%d/%d)', $run['language'], $run['verdict_label'], $run['score'], $run['max_score']));

            foreach ($run['tests'] as $index => $test) {
                if ($test['passed']) {
                    continue;
                }

                $this->line(sprintf(
                    '         %d. teszteset%s (#%s): %s%s',
                    $index + 1,
                    $test['hidden'] ? ' [rejtett]' : '',
                    $test['test_case_id'] ?? '?',
                    $test['verdict_label'],
                    $test['message'] === null ? '' : ' - '.str_replace("\n", ' ', $test['message']),
                ));
            }
        }
    }
}
