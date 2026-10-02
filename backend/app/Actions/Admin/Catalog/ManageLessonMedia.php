<?php

declare(strict_types=1);

namespace App\Actions\Admin\Catalog;

use App\Actions\Audit\RecordAuditEvent;
use App\Enums\AuditAction;
use App\Exceptions\Catalog\InvalidCaptionsFile;
use App\Exceptions\Catalog\InvalidVideoUpload;
use App\Models\Lesson;
use App\Models\LessonUpload;
use App\Models\User;
use App\Services\Catalog\Media\VideoUploader;
use Illuminate\Contracts\Filesystem\Filesystem;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Throwable;

/**
 * A lecke videoja es felirata az admin feluleten (#158): feltoltes, csere,
 * eltavolitas, szerver-hozzaferes nelkul.
 *
 * Minden csere ugyanazt a sorrendet koveti: elobb az uj fajl a tarolora kerul,
 * aztan a sor frissul, es csak UTANA torlodik a regi fajl. Igy egy hiba soran
 * nem marad a lecke videoja nelkul, es sikeres csere utan nincs arva fajl.
 * Ha a sor frissitese sikertelen, az ujonnan irt fajlt visszatoroljuk.
 */
final readonly class ManageLessonMedia
{
    private const WEBVTT_SIGNATURE = 'WEBVTT';

    public function __construct(
        private VideoUploader $uploader,
        private RecordAuditEvent $audit,
    ) {}

    /** @throws InvalidVideoUpload */
    public function beginVideoUpload(Lesson $lesson, User $actor, string $filename, int $size): LessonUpload
    {
        return $this->uploader->begin($lesson, $actor, $filename, $size);
    }

    /** @throws InvalidVideoUpload */
    public function receiveVideoPart(LessonUpload $upload, int $number, string $bytes): void
    {
        $this->uploader->receivePart($upload, $number, $bytes);
    }

    /** @return list<int> */
    public function receivedVideoParts(LessonUpload $upload): array
    {
        return $this->uploader->receivedParts($upload);
    }

    /** @throws InvalidVideoUpload */
    public function completeVideoUpload(LessonUpload $upload, User $actor): Lesson
    {
        $lesson = $upload->lesson;
        $stored = $this->uploader->complete($upload);

        $previous = $this->swap($lesson, 'video_path', $stored->path, 'video_replaced', $actor);
        $this->uploader->discard($upload);
        $this->deleteFile($previous);

        return $lesson;
    }

    public function abortVideoUpload(LessonUpload $upload): void
    {
        $this->uploader->discard($upload);
    }

    /** @throws InvalidCaptionsFile */
    public function saveCaptions(Lesson $lesson, UploadedFile $file, User $actor): Lesson
    {
        $content = (string) $file->get();
        // A BOM-ot a WebVTT megengedi a fajl elejen.
        if (! str_starts_with(ltrim($content, "\u{FEFF}"), self::WEBVTT_SIGNATURE)) {
            throw new InvalidCaptionsFile;
        }

        $path = sprintf('lessons/%d/%s.vtt', $lesson->id, Str::lower(Str::random(40)));
        $this->disk()->put($path, $content);

        $previous = $this->swap($lesson, 'captions_path', $path, 'captions_replaced', $actor);
        $this->deleteFile($previous);

        return $lesson;
    }

    public function removeVideo(Lesson $lesson, User $actor): Lesson
    {
        $this->deleteFile($this->swap($lesson, 'video_path', null, 'video_removed', $actor));

        return $lesson;
    }

    public function removeCaptions(Lesson $lesson, User $actor): Lesson
    {
        $this->deleteFile($this->swap($lesson, 'captions_path', null, 'captions_removed', $actor));

        return $lesson;
    }

    /**
     * A lecke egy utvonal-oszlopanak cserelese (naplozva); visszaadja a korabbi utvonalat.
     * Ha a frissites sikertelen, az uj fajl nem marad arvan.
     */
    private function swap(Lesson $lesson, string $column, ?string $newPath, string $event, User $actor): ?string
    {
        $previous = $lesson->getAttribute($column);

        try {
            DB::transaction(function () use ($lesson, $column, $newPath, $event, $actor, $previous): void {
                $lesson->update([$column => $newPath]);
                $this->audit->handle(AuditAction::CatalogUpdated, $actor, $lesson, [
                    'fields' => [$column],
                    $event => true,
                    'had_previous' => $previous !== null,
                ]);
            });
        } catch (Throwable $e) {
            $this->deleteFile($newPath);

            throw $e;
        }

        return is_string($previous) && $previous !== $newPath ? $previous : null;
    }

    private function deleteFile(?string $path): void
    {
        if ($path !== null) {
            $this->disk()->delete($path);
        }
    }

    private function disk(): Filesystem
    {
        return Storage::disk(Config::string('catalog.video.disk'));
    }
}
