<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Actions\Admin\Catalog\CheckRubric;
use App\Enums\RubricCheckType;
use App\Enums\RubricMode;
use App\Models\Exercise;
use App\Models\RubricItem;
use App\Services\Files\FileDisk;
use App\Services\Files\PrivateFileStore;
use App\Services\Files\UploadedFileInspector;
use App\Services\FileTasks\FileEvaluator;
use App\Services\FileTasks\RubricCheckCatalog;
use Illuminate\Console\Command;
use Illuminate\Database\Eloquent\Collection;

/**
 * Fejlesztoi segedeszkoz az olvasok es a vizsgalatok irasahoz: egy helyi
 * fajlon lefuttatja egy feladat ertekelolapjat, es kiirja az eredmenyt JSON-kent.
 *
 *   php artisan filetasks:evaluate 5 ../tests/fixtures/files/pw-tabla-ok.xlsx
 *   php artisan filetasks:evaluate 5 tabla.xlsx --item="cell_value|Munka1!B2|42" --item="chart|type|column"
 *
 * Az `--item` kapcsoloval a feladat tarolt ertekelolapja helyett alkalmi
 * pontok futnak (mindegyik 1 pontot er), igy egy uj vizsgalat adatbazis-
 * modositas nelkul kiprobalhato. Semmit nem ment: a fajl az ertekeles idejere
 * kerul a beadasok tarolojanak ideiglenes mappajaba, utana torlodik. A
 * feltoltesi ellenorzes (UploadedFileInspector) itt nem fut le.
 */
final class EvaluateFileCommand extends Command
{
    private const ITEM_SEPARATOR = '|';

    protected $signature = 'filetasks:evaluate
        {exercise : A feladat azonosítója, amelynek az értékelőlapja lefut}
        {file : A kiértékelendő fájl helyi útvonala}
        {--item=* : Alkalmi pont a tárolt értékelőlap helyett: "típus|tulajdonság|elvárt érték"}';

    protected $description = 'Egy helyi fájl kiértékelése egy feladat értékelőlapjával (fejlesztői segédeszköz)';

    public function handle(FileEvaluator $evaluator, PrivateFileStore $files, RubricCheckCatalog $catalog): int
    {
        $exerciseId = $this->argument('exercise');
        $path = $this->argument('file');
        $exercise = is_numeric($exerciseId) ? Exercise::query()->find((int) $exerciseId) : null;

        if ($exercise === null) {
            $this->error('Nincs ilyen azonosítójú feladat.');

            return self::FAILURE;
        }

        if (! is_file($path) || ! is_readable($path)) {
            $this->error('A fájl nem található vagy nem olvasható.');

            return self::FAILURE;
        }

        if (filesize($path) > UploadedFileInspector::maxBytesFor('document')) {
            $this->error('A fájl nagyobb a dokumentumok méretkorlátjánál.');

            return self::FAILURE;
        }

        $adHoc = $this->adHocItems($catalog);

        if ($adHoc === null) {
            return self::FAILURE;
        }

        if ($adHoc->isNotEmpty()) {
            $exercise->setRelation('rubricItems', $adHoc);
        }

        $stored = $files->putContents(FileDisk::SubmissionFiles, CheckRubric::TRIAL_DIRECTORY, basename($path), (string) file_get_contents($path));

        try {
            $evaluation = $evaluator->evaluate($exercise, $stored);
        } finally {
            $files->delete($stored);
        }

        $this->line((string) json_encode([
            'status' => $evaluation->status->value,
            'score' => $evaluation->score(),
            'max_score' => $evaluation->maxScore(),
            'passed' => $evaluation->passed(),
            'error' => $evaluation->error,
            ...$evaluation->result->toArray(),
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));

        return self::SUCCESS;
    }

    /**
     * Az `--item` kapcsolokbol keszult, nem mentett pontok; null, ha valamelyik hibas.
     *
     * @return Collection<int, RubricItem>|null
     */
    private function adHocItems(RubricCheckCatalog $catalog): ?Collection
    {
        $items = new Collection;

        foreach (array_values($this->option('item')) as $index => $definition) {
            $parts = explode(self::ITEM_SEPARATOR, (string) $definition, 3);
            $type = RubricCheckType::tryFrom(trim($parts[0]));

            if ($type === null || $type->isManual()) {
                $this->error('Ismeretlen vizsgálattípus: '.$parts[0].'. Lehetséges: '.implode(', ', RubricCheckType::values()));

                return null;
            }

            $property = trim($parts[1] ?? '');
            $expected = trim($parts[2] ?? '');
            $error = $catalog->validate($type, $property, $expected);

            if ($error !== null) {
                $this->error("{$type->value}: {$error}");

                return null;
            }

            $item = new RubricItem([
                'group' => 'Próba',
                'label' => "{$type->value} {$property} = {$expected}",
                'check_type' => $type,
                'property' => $property,
                'expected' => $expected,
                'points' => 1,
                'mode' => RubricMode::Auto,
            ]);
            $item->id = $index + 1;
            $items->push($item);
        }

        return $items;
    }
}
