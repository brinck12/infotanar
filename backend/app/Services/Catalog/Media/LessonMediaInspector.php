<?php

declare(strict_types=1);

namespace App\Services\Catalog\Media;

use Carbon\CarbonImmutable;
use Illuminate\Contracts\Filesystem\Filesystem;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Storage;

/**
 * A lecke fajljainak tenyleges allapota a tarolon (#158): letezik-e, mekkora, mikor
 * toltottek fel. Tarolo-hivasokat vegez (S3-nal halozati keres), ezert csak egy
 * lecke reszletes nezetehez hasznaljuk, listakhoz nem.
 */
final class LessonMediaInspector
{
    public function inspect(?string $path): LessonMediaInfo
    {
        if ($path === null) {
            return LessonMediaInfo::none();
        }

        $disk = $this->disk();
        if (! $disk->exists($path)) {
            return new LessonMediaInfo($path, false, null, null);
        }

        return new LessonMediaInfo(
            $path,
            true,
            $disk->size($path),
            CarbonImmutable::createFromTimestamp($disk->lastModified($path)),
        );
    }

    private function disk(): Filesystem
    {
        return Storage::disk(Config::string('catalog.video.disk'));
    }
}
