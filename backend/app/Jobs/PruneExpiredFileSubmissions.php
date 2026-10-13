<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Jobs\Concerns\AlertsOperatorOnFailure;
use App\Models\ExamAttempt;
use App\Models\FileSubmission;
use App\Services\Files\FileDisk;
use App\Services\Files\PrivateFileStore;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Config;

/**
 * Utemezett megorzesi takaritas (naponta): torli a filetasks.retention_days
 * napnal regebbi gyakorlo fajlbeadasokat es vizsgaprobalkozasokat, a
 * fajljaikkal egyutt (elobb a fajl, utana a sor, hogy ne maradjon arva fajl).
 *
 * Az utemezes a routes/console.php-ben van. Ujrafuttathato: a hianyzo fajl nem hiba.
 */
final class PruneExpiredFileSubmissions implements ShouldBeUnique, ShouldQueue
{
    use AlertsOperatorOnFailure, Queueable;

    private const CHUNK = 200;

    public function handle(PrivateFileStore $files): void
    {
        $cutoff = now()->subDays(max(1, Config::integer('filetasks.retention_days')));

        $this->purge($files, FileSubmission::query()->practice()->where('created_at', '<', $cutoff));

        ExamAttempt::query()
            ->where('created_at', '<', $cutoff)
            ->select('id')
            ->chunkById(self::CHUNK, function (Collection $attempts) use ($files): void {
                $ids = $attempts->modelKeys();

                $this->purge($files, FileSubmission::query()->whereIn('exam_attempt_id', $ids));
                ExamAttempt::query()->whereKey($ids)->delete();
            });
    }

    /** @param Builder<FileSubmission> $query */
    private function purge(PrivateFileStore $files, Builder $query): void
    {
        $query->clone()->select(['id', 'path'])->chunkById(self::CHUNK, function (Collection $chunk) use ($files): void {
            foreach ($chunk as $submission) {
                $files->deletePath(FileDisk::SubmissionFiles, $submission->path);
            }
        });

        $query->delete();
    }
}
