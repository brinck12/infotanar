<?php

declare(strict_types=1);

namespace App\Listeners;

use App\Events\AccountDeleted;
use App\Models\ExamAttempt;
use App\Models\FileSubmission;
use App\Services\Files\FileDisk;
use App\Services\Files\PrivateFileStore;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;

/**
 * GDPR torleskor a feltoltott fajlok es az ertekelesuk szemelyes adat. A
 * felhasznalo soft-delete-elt, ezert az adatbazis cascade nem fut le: itt
 * toroljuk a gyakorlo es a vizsgabeli beadasokat, majd a vizsgaprobalkozasokat.
 *
 * A fajlok a sorok ELOTT torlodnek, hogy egy kozbeni hiba ne hagyjon arva
 * fajlt; a listener ujrafuttathato (a hianyzo fajl nem hiba).
 */
final readonly class PurgeSubmittedFilesOnAccountDeletion
{
    private const CHUNK = 200;

    public function __construct(private PrivateFileStore $files) {}

    public function handle(AccountDeleted $event): void
    {
        $userId = $event->user->id;

        $this->purgeSubmissions(FileSubmission::query()->where('user_id', $userId));

        $attemptIds = ExamAttempt::query()->where('user_id', $userId)->pluck('id');

        if ($attemptIds->isNotEmpty()) {
            // Meg a felhasznalo nelkuli (user_id NULL) vizsgasorok is: a probalkozas az övé volt.
            $this->purgeSubmissions(FileSubmission::query()->whereIn('exam_attempt_id', $attemptIds));
            ExamAttempt::query()->whereKey($attemptIds->all())->delete();
        }

        // Vedohalo: a felhasznalo mappajaban semmi nem maradhat (arva fajl sem).
        $this->files->deleteDirectory(FileDisk::SubmissionFiles, "u{$userId}");
    }

    /** @param Builder<FileSubmission> $query */
    private function purgeSubmissions(Builder $query): void
    {
        $query->clone()->select(['id', 'path'])->chunkById(self::CHUNK, function (Collection $chunk): void {
            foreach ($chunk as $submission) {
                $this->files->deletePath(FileDisk::SubmissionFiles, $submission->path);
            }
        });

        $query->delete();
    }
}
