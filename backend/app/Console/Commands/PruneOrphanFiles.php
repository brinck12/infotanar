<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\Attachment;
use App\Models\FileSubmission;
use App\Services\Files\FileDisk;
use Illuminate\Console\Command;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Support\Facades\Storage;
use Throwable;

/**
 * Arva fajlok takaritasa a privat tarolokon (hetente, routes/console.php).
 *
 * A `submission_files` tarolorol torli azokat az egy napnal regebbi fajlokat,
 * amelyekhez nincs `file_submissions` sor. Az `exercise_files` tarolon csak
 * jelent: szerzoi tartalmat soha nem torlunk automatikusan.
 */
class PruneOrphanFiles extends Command
{
    /** Ennyi masodpercnel frissebb fajlhoz meg lehet, hogy most keszul a sora. */
    private const MIN_AGE_SECONDS = 86_400;

    private const BATCH = 500;

    protected $signature = 'files:prune-orphans';

    protected $description = 'Sor nélküli fájlok törlése a beadások tárolójáról, és jelentés a feladatfájlok tárolójáról';

    public function handle(): int
    {
        $deleted = 0;
        $submissions = Storage::disk(FileDisk::SubmissionFiles->diskName());
        $cutoff = now()->getTimestamp() - self::MIN_AGE_SECONDS;

        foreach (array_chunk(self::filesOf($submissions), self::BATCH) as $paths) {
            $known = array_flip(FileSubmission::query()->whereIn('path', $paths)->get(['path'])->map(static fn (FileSubmission $row): string => $row->path)->all());

            foreach ($paths as $path) {
                if (isset($known[$path])) {
                    continue;
                }

                try {
                    // Kozben torolt fajl (parhuzamos torles): kihagyjuk.
                    if ($submissions->lastModified($path) <= $cutoff) {
                        $submissions->delete($path);
                        $deleted++;
                    }
                } catch (Throwable) {
                    continue;
                }
            }
        }

        $this->info(__('retention.orphans_deleted', ['count' => $deleted]));

        $this->reportAuthoredOrphans();

        return self::SUCCESS;
    }

    /**
     * A tarolo osszes fajlja relativ utvonalkent.
     *
     * @return list<string>
     */
    private static function filesOf(FilesystemAdapter $disk): array
    {
        return array_values(array_filter($disk->allFiles(), is_string(...)));
    }

    /** Szerzoi fajlokat nem torlunk: a csatolmanyhoz nem kotott fajlokat csak felsoroljuk. */
    private function reportAuthoredOrphans(): void
    {
        $orphans = [];
        $authored = Storage::disk(FileDisk::ExerciseFiles->diskName());

        foreach (array_chunk(self::filesOf($authored), self::BATCH) as $paths) {
            $known = array_flip(Attachment::query()->whereIn('path', $paths)->get(['path'])->map(static fn (Attachment $row): string => $row->path)->all());

            foreach ($paths as $path) {
                if (! isset($known[$path])) {
                    $orphans[] = $path;
                }
            }
        }

        if ($orphans === []) {
            return;
        }

        $this->warn(__('retention.orphans_reported', ['count' => count($orphans)]));

        foreach (array_slice($orphans, 0, 100) as $path) {
            $this->line($path);
        }
    }
}
