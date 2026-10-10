<?php

declare(strict_types=1);

namespace App\Services\FileTasks;

use App\Enums\AttachmentRole;
use App\Enums\FileSubmissionStatus;
use App\Models\Exercise;
use App\Models\FileSubmission;
use App\Models\User;
use App\Services\Access\ContentAccess;
use App\Services\Files\AttachmentUrls;
use App\Services\Files\StoredFile;
use Carbon\CarbonImmutable;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\URL;

/**
 * Fajlbeadasok elokeszitese a valaszhoz (FileSubmissionView): az elozo
 * probalkozas pontszama, a feltoltott kep elonezete es a feladat mintakepe.
 *
 * Lekerdezesek: egy beadasnal allando szamu, listanal is (az elozo pontszam a
 * lista szomszedos sorabol jon, nem soronkenti lekerdezesbol).
 */
final readonly class FileSubmissionPresenter
{
    /** A feltoltott fajl alairt kiszolgalasa: GET /file-submissions/{submission}/file (`signed:relative`). */
    public const PREVIEW_ROUTE = 'api.file-submissions.file';

    /** Csak ezek jelennek meg elonezetkent (BACKEND.md 8.12); kiterjesztes => kiszolgalt tipus. */
    public const PREVIEW_MIME = ['.png' => 'image/png', '.svg' => 'image/svg+xml'];

    public function __construct(
        private ContentAccess $access,
        private AttachmentUrls $attachmentUrls,
    ) {}

    /**
     * Egy beadas a nezo szemevel. A `exercise.lesson` kapcsolatot betolti, ha hianyzik.
     */
    public function one(FileSubmission $submission, User $viewer): FileSubmissionView
    {
        $submission->loadMissing('exercise.lesson');

        return new FileSubmissionView(
            $submission,
            $this->previousScore($submission),
            $this->previewUrl($submission),
            $this->sampleUrl($viewer, $submission->exercise),
        );
    }

    /**
     * A felhasznalo gyakorlo beadasai egy feladathoz, a legujabb elol.
     *
     * @return list<FileSubmissionView>
     */
    public function history(User $user, Exercise $exercise, int $limit): array
    {
        // Eggyel tobb sort kerunk: az utolso megjelenitett sor elozo pontszama abbol jon.
        $rows = FileSubmission::query()
            ->practice()
            ->where('user_id', $user->id)
            ->where('exercise_id', $exercise->id)
            ->orderByDesc('id')
            ->limit($limit + 1)
            ->get()
            ->values();

        $sampleUrl = $this->sampleUrl($user, $exercise);
        $views = [];

        foreach ($rows->take($limit) as $index => $row) {
            $row->setRelation('exercise', $exercise);

            $previous = $rows->slice($index + 1)->first(
                static fn (FileSubmission $older): bool => $older->status === FileSubmissionStatus::Evaluated,
            );

            $views[] = new FileSubmissionView($row, $previous?->score, $this->previewUrl($row), $sampleUrl);
        }

        return $views;
    }

    /**
     * Ertekelolap-proba eredmenye a beadas alakjaban, tarolt sor nelkul:
     * `id` 0, `attempt` 1. A visszaadott modellt menteni tilos.
     */
    public function trial(Exercise $exercise, FileEvaluation $evaluation, StoredFile $file, User $viewer): FileSubmissionView
    {
        $submission = new FileSubmission([
            'exercise_id' => $exercise->id,
            'attempt' => 1,
            'original_name' => $file->name,
            'path' => '',
            'extension' => $file->extension,
            'size' => $file->size,
            'sha256' => $file->sha256,
        ]);
        $submission->id = 0;
        $submission->created_at = Carbon::now();
        $evaluation->applyTo($submission);
        $submission->setRelation('exercise', $exercise);

        return new FileSubmissionView($submission, sampleUrl: $this->sampleUrl($viewer, $exercise));
    }

    /** Az elozo ERTEKELT gyakorlo probalkozas pontszama; vizsgaban feltoltott fajlnal nincs ilyen. */
    private function previousScore(FileSubmission $submission): ?int
    {
        if (! $submission->isPractice() || $submission->user_id === null) {
            return null;
        }

        $score = FileSubmission::query()
            ->practice()
            ->where('user_id', $submission->user_id)
            ->where('exercise_id', $submission->exercise_id)
            ->where('id', '<', $submission->id)
            ->where('status', FileSubmissionStatus::Evaluated)
            ->orderByDesc('id')
            ->value('score');

        return is_numeric($score) ? (int) $score : null;
    }

    private function previewUrl(FileSubmission $submission): ?string
    {
        if (! $submission->exists || ! isset(self::PREVIEW_MIME[$submission->extension])) {
            return null;
        }

        return url(URL::temporarySignedRoute(
            self::PREVIEW_ROUTE,
            CarbonImmutable::now()->addMinutes(Config::integer('filetasks.url_ttl_minutes')),
            ['submission' => $submission->id],
            absolute: false,
        ));
    }

    /**
     * A mintakep URL-je. A sajat beadas mindig olvashato, de a feladat
     * tartalma (a minta is az) zarolt feladatnal nem megy ki: lejart
     * elofizetesnel a regi eredmeny minta nelkul jelenik meg.
     */
    private function sampleUrl(User $viewer, Exercise $exercise): ?string
    {
        if (! $this->access->allows($viewer, $exercise->lesson)) {
            return null;
        }

        $sample = $exercise->attachments()->ofRole(AttachmentRole::SampleImage)->shared()->first();

        return $sample === null ? null : $this->attachmentUrls->forStudent($sample);
    }
}
