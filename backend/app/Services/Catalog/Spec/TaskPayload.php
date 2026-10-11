<?php

declare(strict_types=1);

namespace App\Services\Catalog\Spec;

use App\Enums\AttachmentRole;
use App\Enums\ExerciseKind;
use App\Models\Attachment;
use App\Models\Exercise;
use App\Services\Files\AttachmentUrls;

/**
 * A feladat fajtafuggo mezoi a diaknak (GET /tasks/{task}), a frontend
 * `UnlockedTaskDetail` tipusa szerint: fajtankent pontosan egy a `file_task`,
 * `sql_task`, `web_task`, `sheet_practice`, `doc_practice` kozul, kod- es
 * SQL-feladatnal pedig a letoltheto forrasfajlok (`sources`).
 *
 * Alairt letoltesi URL-eket ad ki, ezert CSAK feloldott feladatra hivhato:
 * zarolt feladat valaszaba sem fajl, sem URL nem kerulhet.
 *
 * A csatolmanyokat az `attachments` kapcsolatbol olvassa, ha a hivo betoltotte
 * (tesztesethez nem kotott `source` es `sample_image` szerep eleg); betoltes
 * nelkul fajlok nelkul valaszol, lekerdezest nem indit.
 */
final readonly class TaskPayload
{
    public function __construct(
        private ExerciseSpec $spec,
        private AttachmentUrls $urls,
    ) {}

    /**
     * A diaknak megmutathato csatolmany-szerepek: az `attachments` betoltesenek szukitesehez.
     *
     * @return list<AttachmentRole>
     */
    public static function attachmentRoles(): array
    {
        return [AttachmentRole::Source, AttachmentRole::SampleImage];
    }

    /** @return array<string, mixed> */
    public function for(Exercise $exercise): array
    {
        $spec = $this->spec->export($exercise->kind, $exercise->spec);

        return match ($exercise->kind) {
            // A reszfeladatok pontjai nem itt, hanem a futtatas eredmenyeben jelennek meg.
            ExerciseKind::Code => ['sources' => $this->sources($exercise)],
            ExerciseKind::Sql => [...($spec === null ? [] : ['sql_task' => $spec]), 'sources' => $this->sources($exercise)],
            ExerciseKind::SheetUpload, ExerciseKind::DocUpload, ExerciseKind::VisualUpload => ['file_task' => $this->fileTask($exercise, $spec ?? [])],
            ExerciseKind::Web => $spec === null ? [] : ['web_task' => $spec],
            ExerciseKind::SheetBrowser => $spec === null ? [] : ['sheet_practice' => $spec],
            ExerciseKind::DocBrowser => $spec === null ? [] : ['doc_practice' => $spec],
        };
    }

    /**
     * @param  array<string, mixed>  $spec  az UploadSpec teljes alakja, vagy ures, ha a feladatnak nincs spec-je
     * @return array<string, mixed>
     */
    private function fileTask(Exercise $exercise, array $spec): array
    {
        $sampleImage = $this->shared($exercise, AttachmentRole::SampleImage)[0] ?? null;

        return [
            'steps' => $spec['steps'] ?? [],
            'sources' => $this->sources($exercise),
            'deliverable' => $spec['deliverable'] ?? null,
            'accepted_extensions' => $spec['accepted_extensions'] ?? $exercise->kind->uploadExtensions(),
            'software' => $spec['software'] ?? [],
            'sample_image_url' => $sampleImage === null ? null : $this->urls->forStudent($sampleImage),
            'exam_reference' => $spec['exam_reference'] ?? null,
            'exam_points' => $spec['exam_points'] ?? null,
            // A `raw_points` (hivatalos nyers maximum) szandekosan marad ki: csak az adminnak szol.
        ];
    }

    /**
     * A letoltheto forrasfajlok (a frontend `TaskFile` tipusa).
     *
     * @return list<array{name: string, size: int, url: string}>
     */
    private function sources(Exercise $exercise): array
    {
        return array_map(fn (Attachment $attachment): array => [
            'name' => $attachment->name,
            'size' => $attachment->size,
            'url' => $this->urls->forStudent($attachment),
        ], $this->shared($exercise, AttachmentRole::Source));
    }

    /**
     * A szerep tesztesethez nem kotott csatolmanyai. A tesztesetek sajat
     * (rejtett) bemeneti fajljai akkor sem jutnak ki, ha a hivo veletlenul a
     * teljes kapcsolatot toltotte be.
     *
     * @return list<Attachment>
     */
    private function shared(Exercise $exercise, AttachmentRole $role): array
    {
        if (! $exercise->relationLoaded('attachments')) {
            return [];
        }

        return array_values($exercise->attachments
            ->filter(static fn (Attachment $attachment): bool => $attachment->role === $role
                && $attachment->test_case_id === null
                && $role->isStudentVisible())
            ->all());
    }
}
