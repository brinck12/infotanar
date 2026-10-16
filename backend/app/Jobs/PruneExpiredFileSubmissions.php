<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Events\AccountDeleted;
use App\Jobs\Concerns\AlertsOperatorOnFailure;
use App\Listeners\PurgeAccessGrantsOnAccountDeletion;
use App\Listeners\PurgeLearningProgressOnAccountDeletion;
use App\Listeners\PurgeOralPracticeOnAccountDeletion;
use App\Listeners\PurgeSubmittedFilesOnAccountDeletion;
use App\Models\ExamAttempt;
use App\Models\FileSubmission;
use App\Models\User;
use App\Services\Files\FileDisk;
use App\Services\Files\PrivateFileStore;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Config;
use Throwable;

/**
 * Utemezett megorzesi takaritas (naponta): torli a filetasks.retention_days
 * napnal regebbi gyakorlo fajlbeadasokat es vizsgaprobalkozasokat, a
 * fajljaikkal egyutt (elobb a fajl, utana a sor, hogy ne maradjon arva fajl).
 *
 * Seprest is vegez a torolt (soft-delete) fiokok maradekan: ha a fiok torlesekor futo
 * listener hibazott, a fajlok, a vizsgaprobalkozasok es a szobeli gyakorlas itt tunnek el.
 *
 * Az utemezes a routes/console.php-ben van. Ujrafuttathato: a hianyzo fajl nem hiba.
 */
final class PruneExpiredFileSubmissions implements ShouldBeUnique, ShouldQueue
{
    use AlertsOperatorOnFailure, Queueable;

    private const CHUNK = 200;

    public function handle(PrivateFileStore $files): void
    {
        $this->sweepDeletedAccounts();

        $cutoff = now()->subDays(max(1, Config::integer('filetasks.retention_days')));

        $this->purge($files, FileSubmission::query()->prunable()->where('created_at', '<', $cutoff));

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
        // Chunkonkent torlunk id szerint: a "legjobb sikeres beadas" alkerdezes torles kozben nem valtozhat.
        $query->clone()->select(['id', 'path'])->chunkById(self::CHUNK, function (Collection $chunk) use ($files): void {
            foreach ($chunk as $submission) {
                $files->deletePath(FileDisk::SubmissionFiles, $submission->path);
            }

            FileSubmission::query()->whereKey($chunk->modelKeys())->delete();
        });
    }

    /** A hibas fiok nem allitja meg a tobbit; a hiba jelentesre kerul, es a kovetkezo futas ujraprobalja. */
    private function sweepDeletedAccounts(): void
    {
        User::onlyTrashed()
            ->where(static function (Builder $leftovers): void {
                $leftovers->whereHas('fileSubmissions')->orWhereHas('examAttempts')->orWhereHas('oralPractices')
                    ->orWhereHas('lessonCompletions')->orWhereHas('accessGrants');
            })
            ->chunkById(self::CHUNK, function (Collection $users): void {
                foreach ($users as $user) {
                    try {
                        $event = new AccountDeleted($user);
                        app(PurgeSubmittedFilesOnAccountDeletion::class)->handle($event);
                        app(PurgeOralPracticeOnAccountDeletion::class)->handle($event);
                        app(PurgeLearningProgressOnAccountDeletion::class)->handle($event);
                        app(PurgeAccessGrantsOnAccountDeletion::class)->handle($event);
                    } catch (Throwable $exception) {
                        report($exception);
                    }
                }
            });
    }
}
