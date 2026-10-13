<?php

declare(strict_types=1);

namespace App\Actions\Exams;

use App\Enums\FileSubmissionStatus;
use App\Exceptions\Access\PremiumContentLocked;
use App\Exceptions\Exams\ExamAttemptClosed;
use App\Exceptions\Exams\PartNotUploadable;
use App\Exceptions\FileTasks\MacroEnabledFile;
use App\Exceptions\FileTasks\UnsupportedUpload;
use App\Exceptions\FileTasks\UploadTooLarge;
use App\Models\ExamAttempt;
use App\Models\ExamPart;
use App\Models\FileSubmission;
use App\Models\User;
use App\Services\Exams\AttemptClock;
use App\Services\Exams\ExamAccess;
use App\Services\Files\FileDisk;
use App\Services\Files\PrivateFileStore;
use App\Services\Files\StoredFile;
use App\Services\Files\UploadedFileInspector;
use App\Services\FileTasks\AcceptedExtensions;
use Carbon\CarbonImmutable;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Throwable;

/**
 * Fajl feltoltese egy vizsgaresz feladatahoz. Csak tarolas: az ertekeles a
 * beadaskor tortenik (EvaluateExamAttempt), ezert nincs egyidejuseg-korlat sem.
 *
 * Reszenkent egyetlen fajl lehet: az ujabb feltoltes ugyanazt a sort frissiti
 * (az azonosito marad), a regi fajl a tranzakcio utan torlodik. Ket egyszerre
 * erkezo feltoltesnel az utolso nyer, mert a probalkozas sora zarolt.
 */
final readonly class UploadExamPartFile
{
    public function __construct(
        private SubmitExamAttempt $submit,
        private AttemptClock $clock,
        private ExamAccess $access,
        private UploadedFileInspector $inspector,
        private PrivateFileStore $files,
    ) {}

    /**
     * @param  ExamPart  $part  a `exercise` kapcsolattal; a probalkozas vizsgajahoz tartozik (a hivo ellenorizte)
     *
     * @throws ExamAttemptClosed ha a probalkozas mar be van adva vagy lejart
     * @throws PremiumContentLocked ha a felhasznalo kozben elvesztette a hozzaferest
     * @throws PartNotUploadable ha a resz feladata szerkesztos
     * @throws UnsupportedUpload|UploadTooLarge|MacroEnabledFile ha a fajl nem fogadhato el
     */
    public function handle(User $user, ExamAttempt $attempt, ExamPart $part, UploadedFile $file): ExamAttempt
    {
        $current = $this->submit->closeIfExpired($attempt);

        if (! $current->isOpen()) {
            throw new ExamAttemptClosed;
        }

        $denial = $this->access->denialFor($user);

        if ($denial !== null) {
            throw new PremiumContentLocked($denial);
        }

        $exercise = $part->exercise;

        if ($exercise === null || ! $exercise->kind->isUpload()) {
            throw new PartNotUploadable;
        }

        $upload = $this->inspector->inspect($file, AcceptedExtensions::for($exercise));
        $stored = $this->files->put(FileDisk::SubmissionFiles, "u{$user->id}/x{$attempt->id}", $upload);

        try {
            return DB::transaction(function () use ($user, $attempt, $part, $stored): ExamAttempt {
                $locked = ExamAttempt::query()->lockForUpdate()->findOrFail($attempt->id);

                // A zar alatt megint: kozben beadhattak masik lapon, vagy lejarhatott a hatarido.
                if (! $locked->isOpen() || $this->clock->isExpired($locked)) {
                    throw new ExamAttemptClosed;
                }

                $this->replace($user, $locked, $part, $stored);

                $locked->last_activity_at = CarbonImmutable::now();
                $locked->save();

                return $locked;
            });
        } catch (Throwable $exception) {
            // Sor nelkul az uj fajl arva lenne.
            $this->files->delete($stored);

            throw $exception;
        }
    }

    private function replace(User $user, ExamAttempt $attempt, ExamPart $part, StoredFile $stored): void
    {
        $row = FileSubmission::query()
            ->where('exam_attempt_id', $attempt->id)
            ->where('exam_part_id', $part->id)
            ->first();

        $fields = [
            'original_name' => $stored->name,
            'path' => $stored->path,
            'extension' => $stored->extension,
            'size' => $stored->size,
            'sha256' => $stored->sha256,
            // Az ertekeles a beadaskor tortenik: az uj fajl addig tarolt, pontszam nelkul.
            'status' => FileSubmissionStatus::Stored,
            'score' => 0,
            'max_score' => 0,
            'passed' => false,
            'result' => null,
            'error' => null,
            'evaluated_at' => null,
        ];

        if ($row === null) {
            FileSubmission::query()->create([
                ...$fields,
                'user_id' => $user->id,
                'exercise_id' => $part->exercise_id,
                'exam_attempt_id' => $attempt->id,
                'exam_part_id' => $part->id,
                'attempt' => 1,
            ]);

            return;
        }

        $replaced = $row->storedFile();
        $row->fill($fields)->save();

        DB::afterCommit(fn () => $this->files->delete($replaced));
    }
}
