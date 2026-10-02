<?php

declare(strict_types=1);

namespace App\Services\Catalog\Media;

use App\Models\Lesson;
use Illuminate\Contracts\Filesystem\Filesystem;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Storage;

/**
 * Elarvult fajlok es "lelogo" utvonalak keresese (#158). Az arva fajlt csak a
 * `lessons/` alatt keressuk: amit kezzel masutt helyeztek el (haladó utvonal-mezo),
 * azt a rendszer nem sajatja, nem jelezzuk arvanak.
 */
final class LessonMediaAuditor
{
    private const MANAGED_PREFIX = 'lessons';

    public function audit(): MediaAudit
    {
        $disk = $this->disk();
        $referenced = $this->referencedPaths();

        $orphans = array_values(array_diff($disk->allFiles(self::MANAGED_PREFIX), $referenced));
        $dangling = array_values(array_filter($referenced, static fn (string $path): bool => ! $disk->exists($path)));

        sort($orphans);
        sort($dangling);

        return new MediaAudit($orphans, $dangling);
    }

    /** @return list<string> */
    private function referencedPaths(): array
    {
        $paths = [];

        // Csak a ket oszlop kerul be a memoriaba, nem a lecke-modellek (a tartalom nagy lehet).
        foreach (Lesson::query()->select(['video_path', 'captions_path'])->toBase()->cursor() as $row) {
            foreach ([$row->video_path, $row->captions_path] as $path) {
                if (is_string($path) && $path !== '') {
                    $paths[$path] = true;
                }
            }
        }

        return array_keys($paths);
    }

    private function disk(): Filesystem
    {
        return Storage::disk(Config::string('catalog.video.disk'));
    }
}
