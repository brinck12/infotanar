<?php

declare(strict_types=1);

namespace App\Http\Resources\Catalog;

use App\Models\Exercise;
use App\Models\Lesson;
use App\Services\Catalog\LessonPage;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Egy lecke oldala (`GET /tracks/{track}/lessons/{lesson}`). Zarolt leckenel
 * a tananyag (`content`) kimarad, ugyanugy, mint a zarolt feladat leirasa: a
 * kliens a `locked` es a `locked_reason` alapjan mutat paywallt.
 *
 * @property LessonPage $resource
 */
final class LessonResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $page = $this->resource;
        $lesson = $page->lesson;
        $unlocked = $page->denial === null;

        return [
            'id' => $lesson->id,
            'slug' => $lesson->slug,
            'title' => $lesson->title,
            'track' => ['slug' => $page->track->slug, 'title' => $page->track->title],
            'module' => ['id' => $lesson->module_id, 'title' => $lesson->module?->title],
            'is_free' => $lesson->is_free,
            'locked' => ! $unlocked,
            'locked_reason' => $page->denial?->value,
            'locked_message' => $page->denial?->message(),
            // A videot a lejatszo kulon keri le (GET /lessons/{id}/video), rovid eletu URL-lel.
            'has_video' => $lesson->video_path !== null,
            // Vendegnel null: neki nincs haladasa.
            'status' => $page->status?->value,
            'content' => $this->when($unlocked, fn (): string => $lesson->content ?? ''),
            'exercises' => $lesson->exercises->map(static fn (Exercise $exercise): array => [
                'id' => $exercise->id,
                'title' => $exercise->title,
                'level' => $exercise->level,
                'difficulty' => $exercise->difficulty,
                'allowed_languages' => $exercise->allowed_languages,
                // "solved", "attempted", vagy null (vendegnel es beadas nelkul).
                'my_status' => $page->exerciseStatuses->of($exercise->id)?->value,
            ]),
            'previous' => self::link($page->previous),
            'next' => self::link($page->next),
        ];
    }

    /** @return array{slug: string, title: string}|null */
    private static function link(?Lesson $lesson): ?array
    {
        return $lesson === null ? null : ['slug' => $lesson->slug, 'title' => $lesson->title];
    }
}
