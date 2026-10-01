<?php

declare(strict_types=1);

namespace App\Services\Execution\Files;

use App\Models\Exercise;
use App\Models\ExerciseFile;
use App\Models\TestCase;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Config;
use RuntimeException;
use ZipArchive;

/**
 * Egy teszteset futasahoz szukseges adatfajlok, a Judge0 `additional_files`
 * mezojenek formajaban (base64-elt zip).
 *
 * A teszteset sajat fajlja felulirja az azonos nevu kozos fajlt, igy egy
 * rejtett teszteset ugyanazon a fajlnev alatt mas adatot kaphat.
 */
final class ExecutionFileArchive
{
    /**
     * @return string|null A base64-elt zip; null, ha a tesztesethez nincs fajl.
     *
     * A fajlokat a hivo toltse elore (`$exercise->sharedFiles`, `$testCase->files`),
     * hogy tesztesetenkent ne induljon uj lekerdezes.
     */
    public function for(Exercise $exercise, TestCase $testCase): ?string
    {
        $files = $this->effectiveFiles($exercise, $testCase);

        if ($files->isEmpty()) {
            return null;
        }

        // A zip tartalma csak a fajlokon mulik: azonos fajlkeszlet (pl. ket
        // teszteset, vagy egy ujabb futas) ugyanazt a cache-bejegyzest hasznalja.
        $key = 'judge0.files.'.sha1($files->map(static fn (ExerciseFile $file): string => $file->name.':'.$file->sha256)->implode('|'));

        return Cache::remember($key, Config::integer('judge0.files.archive_cache_ttl'), fn (): string => $this->zip($files));
    }

    /** @return Collection<string, ExerciseFile> Fajlnev szerint indexelve, nev szerint rendezve. */
    private function effectiveFiles(Exercise $exercise, TestCase $testCase): Collection
    {
        // toBase(): az Eloquent-gyujtemeny merge()-je modell-azonosito szerint egyesit, nem nev szerint.
        return $exercise->sharedFiles->toBase()
            ->keyBy('name')
            ->merge($testCase->files->toBase()->keyBy('name'))
            ->sortKeys();
    }

    /** @param Collection<string, ExerciseFile> $files */
    private function zip(Collection $files): string
    {
        $path = tempnam(sys_get_temp_dir(), 'exfiles');
        if ($path === false) {
            throw new RuntimeException('Cannot create a temporary file for the exercise file archive.');
        }

        try {
            $zip = new ZipArchive;
            if ($zip->open($path, ZipArchive::OVERWRITE) !== true) {
                throw new RuntimeException('Cannot open the exercise file archive for writing.');
            }

            foreach ($files as $name => $file) {
                $zip->addFromString((string) $name, $file->bytes());
            }

            $zip->close();

            return base64_encode((string) file_get_contents($path));
        } finally {
            @unlink($path);
        }
    }
}
