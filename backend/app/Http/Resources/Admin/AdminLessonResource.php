<?php

declare(strict_types=1);

namespace App\Http\Resources\Admin;

use App\Models\Lesson;
use App\Services\Catalog\Media\LessonMediaInfo;
use App\Services\Catalog\Media\LessonMediaInspector;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Lesson */
final class AdminLessonResource extends JsonResource
{
    private ?LessonMediaInfo $video = null;

    private ?LessonMediaInfo $captions = null;

    /** A lecke reszletes nezete a fajlok tenyleges allapotaval (tarolo-hivasokkal). */
    public static function detailed(Lesson $lesson, LessonMediaInspector $inspector): self
    {
        return self::make($lesson)->withMedia($inspector->inspect($lesson->video_path), $inspector->inspect($lesson->captions_path));
    }

    /**
     * A fajlok tenyleges allapotaval egeszit ki (letezik-e, meret, feltoltes ideje). Tarolo-hivasokat
     * igenyel, ezert csak a reszletes nezet kapja meg, a lista nem (S3-nal listaelemenkent egy HEAD).
     */
    public function withMedia(LessonMediaInfo $video, LessonMediaInfo $captions): self
    {
        $this->video = $video;
        $this->captions = $captions;

        return $this;
    }

    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'module_id' => $this->module_id,
            'slug' => $this->slug,
            'title' => $this->title,
            'content' => $this->content,
            'video_path' => $this->video_path,
            'captions_path' => $this->captions_path,
            'video' => $this->when($this->video !== null, fn (): array => $this->mediaToArray($this->video)),
            'captions' => $this->when($this->captions !== null, fn (): array => $this->mediaToArray($this->captions)),
            'position' => $this->position,
            'is_free' => $this->is_free,
            'is_published' => $this->is_published,
            'exercise_count' => $this->whenCounted('exercises'),
            'exercises' => AdminExerciseResource::collection($this->whenLoaded('exercises')),
        ];
    }

    /** @return array{path: string|null, exists: bool, size: int|null, uploaded_at: string|null} */
    private function mediaToArray(?LessonMediaInfo $media): array
    {
        $media ??= LessonMediaInfo::none();

        return [
            'path' => $media->path,
            'exists' => $media->exists,
            'size' => $media->size,
            'uploaded_at' => $media->uploadedAt?->toIso8601String(),
        ];
    }
}
