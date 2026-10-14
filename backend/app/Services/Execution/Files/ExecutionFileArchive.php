<?php

declare(strict_types=1);

namespace App\Services\Execution\Files;

use App\Enums\AttachmentRole;
use App\Models\Attachment;
use App\Models\Exercise;
use App\Models\TestCase;
use App\Services\Files\PrivateFileStore;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Config;
use Throwable;
use ZipArchive;

/**
 * Egy teszteset futasahoz szukseges adatfajlok a Judge0 `additional_files`
 * mezojenek alakjaban (base64-elt zip). A Judge0 a zipet a program
 * munkakonyvtaraba csomagolja ki, igy a megoldas a fajlt a neven nyitja meg
 * (`open("adatok.txt")`).
 *
 * A keszlet: a feladat kozos forrasfajljai (`source`), amelyeket a teszteset
 * sajat bemeneti fajlja (`input`) azonos neven felulir. Igy egy rejtett
 * teszteset ugyanazon a fajlneven mas adatot kaphat, amit a diak soha nem lat.
 */
final readonly class ExecutionFileArchive
{
    public function __construct(private PrivateFileStore $store) {}

    /**
     * A feladat futtatashoz tartozo csatolmanyai egyetlen lekerdezessel; a
     * kiertekeles ezt adja tovabb tesztesetenkent a `for()`-nak.
     *
     * @return Collection<int, Attachment>
     */
    public function attachmentsOf(Exercise $exercise): Collection
    {
        return $exercise->attachments()->ofRole([AttachmentRole::Source, AttachmentRole::Input])->get();
    }

    /**
     * @param  Collection<int, Attachment>  $attachments  az `attachmentsOf()` eredmenye
     * @return string|null a base64-elt zip; null, ha a tesztesethez nincs fajl
     *
     * @throws ExecutionFilesUnavailable
     */
    public function for(Collection $attachments, TestCase $testCase): ?string
    {
        $files = $this->effectiveFiles($attachments, $testCase);

        if ($files === []) {
            return null;
        }

        // A zip tartalma csak a neveken es a tartalmakon mulik: azonos keszlet
        // (a tobbi teszteset, egy ujabb futtatas) ugyanazt a bejegyzest hasznalja,
        // es a fajlokat sem kell ujra beolvasni.
        $fingerprint = implode('|', array_map(
            static fn (Attachment $file): string => $file->name.':'.$file->sha256,
            $files,
        ));

        return Cache::remember(
            'judge0.files.'.hash('sha256', $fingerprint),
            Config::integer('judge0.files.archive_cache_ttl'),
            fn (): string => $this->zip($files),
        );
    }

    /**
     * @param  Collection<int, Attachment>  $attachments
     * @return array<array-key, Attachment> fajlnev szerint (a csupa szamjegy nev egesz kulcs lesz), nev szerinti sorrendben
     */
    private function effectiveFiles(Collection $attachments, TestCase $testCase): array
    {
        $files = [];

        foreach ($attachments as $attachment) {
            if ($attachment->role === AttachmentRole::Source && $attachment->test_case_id === null) {
                // A sajat bemeneti fajl az eros: a kozos csak akkor kerul be, ha nincs ilyen nevu.
                $files[$attachment->name] ??= $attachment;
            } elseif ($attachment->role === AttachmentRole::Input && $attachment->test_case_id === $testCase->id) {
                $files[$attachment->name] = $attachment;
            }
        }

        ksort($files, SORT_STRING);

        return $files;
    }

    /**
     * @param  array<array-key, Attachment>  $files
     *
     * @throws ExecutionFilesUnavailable
     */
    private function zip(array $files): string
    {
        $path = tempnam(sys_get_temp_dir(), 'exfiles');
        if ($path === false) {
            throw ExecutionFilesUnavailable::because('Cannot create a temporary file for the execution file archive.');
        }

        try {
            $zip = new ZipArchive;
            if ($zip->open($path, ZipArchive::OVERWRITE) !== true) {
                throw ExecutionFilesUnavailable::because('Cannot open the execution file archive for writing.');
            }

            foreach ($files as $file) {
                $zip->addFromString($file->name, $this->bytes($file));
            }

            if (! $zip->close()) {
                throw ExecutionFilesUnavailable::because('Cannot write the execution file archive.');
            }

            return base64_encode((string) file_get_contents($path));
        } finally {
            @unlink($path);
        }
    }

    /** @throws ExecutionFilesUnavailable */
    private function bytes(Attachment $file): string
    {
        try {
            return $this->store->bytes($file->storedFile());
        } catch (Throwable $e) {
            throw ExecutionFilesUnavailable::because("Cannot read attachment {$file->id} ({$file->name}) from storage.", $e);
        }
    }
}
