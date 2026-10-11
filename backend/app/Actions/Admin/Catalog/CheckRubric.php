<?php

declare(strict_types=1);

namespace App\Actions\Admin\Catalog;

use App\Enums\AttachmentRole;
use App\Exceptions\FileTasks\EvaluatorBusy;
use App\Exceptions\FileTasks\MacroEnabledFile;
use App\Exceptions\FileTasks\NotAFileTask;
use App\Exceptions\FileTasks\SampleSolutionMissing;
use App\Exceptions\FileTasks\UnsupportedUpload;
use App\Exceptions\FileTasks\UploadTooLarge;
use App\Models\Exercise;
use App\Models\User;
use App\Services\Files\FileDisk;
use App\Services\Files\PrivateFileStore;
use App\Services\Files\UploadedFileInspector;
use App\Services\FileTasks\AcceptedExtensions;
use App\Services\FileTasks\EvaluationGate;
use App\Services\FileTasks\FileEvaluator;
use App\Services\FileTasks\FileSubmissionPresenter;
use App\Services\FileTasks\FileSubmissionView;
use Illuminate\Http\UploadedFile;

/**
 * Ertekelolap-proba ("probald ki a mintamegoldassal"): a szerzo egy fajlon
 * lefuttatja a feladat ertekelolapjat, hogy lassa, jol irta-e meg a pontokat.
 *
 * Fajl nelkul a feladat feltoltott mintamegoldasa (`sample_solution`) fut. A
 * feltoltott probafajl ugyanazon az ellenorzesen megy at, mint a diake, de
 * beadas nem keletkezik belole: az olvasoknak tarolt fajl kell, ezert az
 * ertekeles idejere a beadasok tarolojanak ideiglenes mappajaba kerul, es
 * utana azonnal torlodik. Az eredmeny a beadas alakjaban megy vissza
 * (`id` 0, `attempt` 1).
 */
final readonly class CheckRubric
{
    /** Ideiglenes mappa a `submission_files` tarolon; sor soha nem mutat ide. */
    public const TRIAL_DIRECTORY = 'rubric-check';

    public function __construct(
        private UploadedFileInspector $inspector,
        private PrivateFileStore $files,
        private EvaluationGate $gate,
        private FileEvaluator $evaluator,
        private FileSubmissionPresenter $presenter,
    ) {}

    /**
     * @param  Exercise  $exercise  a `lesson` kapcsolattal
     *
     * @throws NotAFileTask ha a feladat nem feltoltos fajtaju
     * @throws SampleSolutionMissing ha nincs fajl, es a feladatnak nincs mintamegoldasa
     * @throws UnsupportedUpload|UploadTooLarge|MacroEnabledFile ha a probafajl nem fogadhato el
     * @throws EvaluatorBusy ha minden ertekelo hely foglalt
     */
    public function handle(Exercise $exercise, ?UploadedFile $file, User $admin): FileSubmissionView
    {
        if (! $exercise->kind->acceptsFileSubmission()) {
            throw new NotAFileTask;
        }

        if ($file === null) {
            $sample = $exercise->attachments()->ofRole(AttachmentRole::SampleSolution)->first()?->storedFile()
                ?? throw new SampleSolutionMissing;

            return $this->gate->run(fn (): FileSubmissionView => $this->presenter->trial($exercise, $this->evaluator->evaluate($exercise, $sample), $sample, $admin));
        }

        $upload = $this->inspector->inspect($file, AcceptedExtensions::for($exercise));

        // A probafajl csak addig el a tarolon, amig egy ertekelo hely foglalt.
        return $this->gate->run(function () use ($exercise, $upload, $admin): FileSubmissionView {
            $stored = $this->files->put(FileDisk::SubmissionFiles, self::TRIAL_DIRECTORY, $upload);

            try {
                return $this->presenter->trial($exercise, $this->evaluator->evaluate($exercise, $stored), $stored, $admin);
            } finally {
                $this->files->delete($stored);
            }
        });
    }
}
