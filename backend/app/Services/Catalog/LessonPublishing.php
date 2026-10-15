<?php

declare(strict_types=1);

namespace App\Services\Catalog;

use App\Exceptions\Catalog\LessonNotPublishable;
use App\Models\Lesson;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Storage;

/**
 * Mikor publikalhato egy lecke: akkor, ha van mit megmutatni benne. Ures a
 * lecke, ha nincs jegyzete, nincs hozza feladat, es a videoutvonala vagy nincs
 * megadva, vagy nem mutat letezo fajlra a privat video-taroloban.
 */
final readonly class LessonPublishing
{
    /** A lecke mezoi, amelyeknek valtozasa miatt a tartalom-ellenorzes ujra lefut. */
    private const CONTENT_FIELDS = ['is_published', 'content', 'video_path'];

    /**
     * Csak akkor ellenoriz, ha a lecke a mentes utan publikalt, es a publikalas vagy
     * a tartalma valtozik: egy regi, mar publikalt lecke athelyezeset nem akasztja meg.
     *
     * @throws LessonNotPublishable
     */
    public function assertPublishable(Lesson $lesson): void
    {
        if (! $lesson->is_published) {
            return;
        }

        if ($lesson->exists && ! $lesson->isDirty(self::CONTENT_FIELDS)) {
            return;
        }

        if (! $this->hasContent($lesson)) {
            throw LessonNotPublishable::empty();
        }
    }

    private function hasContent(Lesson $lesson): bool
    {
        if (trim((string) $lesson->content) !== '') {
            return true;
        }

        if ($lesson->video_path !== null && $lesson->video_path !== ''
            && Storage::disk(Config::string('catalog.video.disk'))->exists($lesson->video_path)) {
            return true;
        }

        return $lesson->exists && $lesson->exercises()->exists();
    }
}
