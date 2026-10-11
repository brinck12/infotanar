<?php

declare(strict_types=1);

namespace App\Actions\FileTasks;

use App\Actions\Progress\RecordLessonProgress;
use App\Enums\FileSubmissionStatus;
use App\Exceptions\Access\PremiumContentLocked;
use App\Exceptions\FileTasks\EvaluatorBusy;
use App\Exceptions\FileTasks\MacroEnabledFile;
use App\Exceptions\FileTasks\NotAFileTask;
use App\Exceptions\FileTasks\UnsupportedUpload;
use App\Exceptions\FileTasks\UploadTooLarge;
use App\Models\Exercise;
use App\Models\FileSubmission;
use App\Models\User;
use App\Services\Access\ContentAccess;
use App\Services\Files\FileDisk;
use App\Services\Files\InspectedUpload;
use App\Services\Files\PrivateFileStore;
use App\Services\Files\UploadedFileInspector;
use App\Services\FileTasks\AcceptedExtensions;
use App\Services\FileTasks\EvaluationGate;
use App\Services\FileTasks\FileEvaluator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Throwable;

/**
 * Egy fajl beadasa gyakorlo fajlfeladathoz: ellenorzes, tarolas, szinkron
 * ertekeles az ertekelolap szerint (BACKEND.md 4.3.3).
 *
 * - Elutasitott feltoltesbol (rossz tipus, tul nagy, makros, nem biztonsagos
 *   archivum) semmi nem tarolodik: ezek 422-es hibak.
 * - Elfogadott, de nem ertelmezheto fajl beadasnak szamit: a sor `failed`
 *   allapotu lesz a magyar okkal, a sorszam ugyanugy no.
 * - Egyszerre korlatozott szamu ertekeles futhat (EvaluationGate); ha nincs
 *   szabad hely, a valasz 503, tarolas nelkul.
 * - Feladatonkent es diakonkent a legujabb `filetasks.keep_per_exercise`
 *   gyakorlo beadas marad meg, a regebbiek fajlostul torlodnek.
 */
final readonly class SubmitFileSolution
{
    /** A PHP sajat idokorlatja ennyivel hosszabb az ertekelo faliora-korlatjanal: az utobbi lepjen eletbe elobb. */
    private const HARD_LIMIT_MARGIN_SECONDS = 10;

    /** Egy feltoltes utan legfeljebb ennyi regi beadast torlunk. */
    private const PRUNE_BATCH = 100;

    public function __construct(
        private ContentAccess $access,
        private UploadedFileInspector $inspector,
        private PrivateFileStore $files,
        private EvaluationGate $gate,
        private FileEvaluator $evaluator,
        private RecordLessonProgress $recordLessonProgress,
    ) {}

    /**
     * @param  Exercise  $exercise  a `lesson` kapcsolattal
     *
     * @throws NotAFileTask ha a feladat nem feltoltos fajtaju
     * @throws PremiumContentLocked ha a felhasznalo nem fer hozza a feladat leckejehez
     * @throws UnsupportedUpload|UploadTooLarge|MacroEnabledFile ha a fajl nem fogadhato el
     * @throws EvaluatorBusy ha minden ertekelo hely foglalt
     */
    public function handle(User $user, Exercise $exercise, UploadedFile $file): FileSubmission
    {
        if (! $exercise->kind->acceptsFileSubmission()) {
            throw new NotAFileTask;
        }

        $denial = $this->access->denialFor($user, $exercise->lesson);

        if ($denial !== null) {
            throw new PremiumContentLocked($denial);
        }

        $upload = $this->inspector->inspect($file, AcceptedExtensions::for($exercise));

        return $this->gate->run(function () use ($user, $exercise, $upload): FileSubmission {
            // Vegso vedohalo az elakadt ertekeles ellen; rendes esetben az ertekelo sajat korlatja all meg elobb.
            set_time_limit(Config::integer('filetasks.evaluation_timeout') + self::HARD_LIMIT_MARGIN_SECONDS);

            $submission = $this->store($user, $exercise, $upload);
            $this->evaluate($user, $exercise, $submission);
            $this->pruneOldAttempts($user, $exercise);

            return $submission;
        });
    }

    /** Eltarolja a fajlt, es letrehozza a sort a kovetkezo sorszammal. */
    private function store(User $user, Exercise $exercise, InspectedUpload $upload): FileSubmission
    {
        $stored = $this->files->put(FileDisk::SubmissionFiles, "u{$user->id}/e{$exercise->id}", $upload);

        try {
            return DB::transaction(function () use ($user, $exercise, $stored): FileSubmission {
                // A sorszam kiosztasa felhasznalonkent sorban tortenik: ket egyszerre erkezo
                // feltoltes ne kapja ugyanazt a szamot.
                User::query()->whereKey($user->id)->lockForUpdate()->first();

                $last = $this->practiceAttempts($user, $exercise)->max('attempt');

                return FileSubmission::query()->create([
                    'user_id' => $user->id,
                    'exercise_id' => $exercise->id,
                    'attempt' => (is_numeric($last) ? (int) $last : 0) + 1,
                    'original_name' => $stored->name,
                    'path' => $stored->path,
                    'extension' => $stored->extension,
                    'size' => $stored->size,
                    'sha256' => $stored->sha256,
                ]);
            });
        } catch (Throwable $exception) {
            // Sor nelkul a fajl arva lenne.
            $this->files->delete($stored);

            throw $exception;
        }
    }

    private function evaluate(User $user, Exercise $exercise, FileSubmission $submission): void
    {
        try {
            $this->evaluator->evaluate($exercise, $submission->storedFile())->applyTo($submission);
            $submission->save();
        } catch (Throwable $exception) {
            // A sor ne maradjon `stored` allapotban orokre: sikertelen beadasnak latszik, a hiba pedig tovabbmegy.
            $this->markFailed($submission);

            throw $exception;
        }

        if ($submission->passed) {
            $this->recordLessonProgress->handle($user, $exercise->lesson);
        }
    }

    private function markFailed(FileSubmission $submission): void
    {
        try {
            $submission->status = FileSubmissionStatus::Failed;
            $submission->result = null;
            $submission->score = 0;
            $submission->max_score = 0;
            $submission->passed = false;
            $submission->error = __('filetasks.unreadable');
            $submission->save();
        } catch (Throwable $secondary) {
            // Ha a mentes sem megy (pl. nincs adatbazis), az eredeti hiba a fontos.
            report($secondary);
        }
    }

    /** A megtartandonal regebbi gyakorlo beadasok torlese: elobb a fajl, utana a sor, hogy ne maradjon arva fajl. */
    private function pruneOldAttempts(User $user, Exercise $exercise): void
    {
        // Feltoltesenkent rendszerint egyetlen sor esik ki; a korlat csak a lekerdezest tartja vegesen.
        $stale = $this->practiceAttempts($user, $exercise)
            ->orderByDesc('id')
            ->offset(max(1, Config::integer('filetasks.keep_per_exercise')))
            ->limit(self::PRUNE_BATCH)
            ->get(['id', 'path']);

        if ($stale->isEmpty()) {
            return;
        }

        foreach ($stale as $old) {
            $this->files->deletePath(FileDisk::SubmissionFiles, $old->path);
        }

        FileSubmission::query()->whereKey($stale->modelKeys())->delete();
    }

    /** @return Builder<FileSubmission> */
    private function practiceAttempts(User $user, Exercise $exercise): Builder
    {
        return FileSubmission::query()
            ->practice()
            ->where('user_id', $user->id)
            ->where('exercise_id', $exercise->id);
    }
}
