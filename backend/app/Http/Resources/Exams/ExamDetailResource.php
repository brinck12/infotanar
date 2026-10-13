<?php

declare(strict_types=1);

namespace App\Http\Resources\Exams;

use App\Enums\AttachmentRole;
use App\Models\Attachment;
use App\Models\Exam;
use App\Models\ExamPart;
use App\Services\Exams\AttemptProgress;
use App\Services\Files\AttachmentUrls;
use App\Services\FileTasks\AcceptedExtensions;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Egy vizsga részletei (frontend `ExamDetail`): a részek szövege, forrásfájljai
 * és az elvárt beadandó. Aki nem fér hozzá (`$unlocked` false), csak a
 * szerkezetet látja: üres szöveg, lépések és források, `source_zip` null.
 *
 * A hívónak be kell töltenie: `parts.exercise.attachments`, `attachments`.
 * A fájl-URL-ek (exams.file_url_ttl_minutes) hosszabb életűek, mert a vizsga
 * órákig tart, és az oldal az első választ tartja meg.
 *
 * @mixin Exam
 */
final class ExamDetailResource extends JsonResource
{
    public function __construct(
        private readonly Exam $exam,
        private readonly bool $unlocked,
        private readonly ?AttemptProgress $progress = null,
    ) {
        parent::__construct($exam);
    }

    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $urls = resolve(AttachmentUrls::class);

        return [
            ...ExamSummaryResource::header($this->exam),
            'parts' => $this->exam->parts->map(fn (ExamPart $part): array => $this->part($part, $urls))->all(),
            'attempt' => ExamSummaryResource::attemptPayload($this->exam, $this->progress),
            'source_zip' => $this->unlocked ? $this->sourceZip($urls) : null,
        ];
    }

    /** @return array<string, mixed> */
    private function part(ExamPart $part, AttachmentUrls $urls): array
    {
        $exercise = $part->exercise;
        $info = ExamSummaryResource::partInfo($part);

        if ($exercise === null) {
            return [...$info, ...$this->locked(null)];
        }

        $editor = $exercise->kind->isEditorBased();

        if (! $this->unlocked) {
            return [...$info, ...$this->locked($editor ? $exercise->id : null)];
        }

        $spec = $exercise->spec ?? [];
        $software = $this->strings($spec['software'] ?? null);

        return [
            ...$info,
            'description' => $exercise->description,
            'steps' => $editor ? [] : $this->strings($spec['steps'] ?? null),
            'sources' => $this->sources($exercise->attachments, $urls),
            'deliverable' => is_string($spec['deliverable'] ?? null) ? $spec['deliverable'] : null,
            'accepted_extensions' => $exercise->kind->isUpload() ? AcceptedExtensions::for($exercise) : [],
            'software' => $software === [] ? null : implode(' / ', $software),
            // Csak a szerkesztős részeknél: a futtató ebből tudja, hogy a beépített szerkesztőt kell megnyitni.
            'exercise_id' => $editor ? $exercise->id : null,
        ];
    }

    /**
     * A szerkezet tartalom nélkül.
     *
     * @return array<string, mixed>
     */
    private function locked(?int $exerciseId): array
    {
        return [
            'description' => '',
            'steps' => [],
            'sources' => [],
            'deliverable' => null,
            'accepted_extensions' => [],
            'software' => null,
            'exercise_id' => $exerciseId,
        ];
    }

    /** @return list<string> */
    private function strings(mixed $value): array
    {
        return is_array($value) ? array_values(array_filter($value, is_string(...))) : [];
    }

    /**
     * @param  iterable<Attachment>  $attachments
     * @return list<array{name: string, size: int, url: string}>
     */
    private function sources(iterable $attachments, AttachmentUrls $urls): array
    {
        $files = [];

        foreach ($attachments as $attachment) {
            // A teszteshez kötött bemenet és a mintamegoldás soha nem megy ki.
            if ($attachment->role === AttachmentRole::Source && $attachment->test_case_id === null) {
                $files[] = ['name' => $attachment->name, 'size' => $attachment->size, 'url' => $urls->forExam($attachment)];
            }
        }

        return $files;
    }

    /** @return array{name: string, size: int, url: string}|null */
    private function sourceZip(AttachmentUrls $urls): ?array
    {
        $zip = $this->exam->attachments->first(static fn (Attachment $attachment): bool => $attachment->role === AttachmentRole::SourceZip);

        return $zip === null ? null : ['name' => $zip->name, 'size' => $zip->size, 'url' => $urls->forExam($zip)];
    }
}
