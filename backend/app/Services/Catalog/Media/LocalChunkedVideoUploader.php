<?php

declare(strict_types=1);

namespace App\Services\Catalog\Media;

use App\Exceptions\Catalog\InvalidVideoUpload;
use App\Models\Lesson;
use App\Models\LessonUpload;
use App\Models\User;
use Illuminate\Contracts\Filesystem\Filesystem;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

/**
 * A darabok a szerveren, a staging taroloban allnak ossze (`{feltoltes}/{n}.part`),
 * a lezarasnal egy ideiglenes fajlba fuzodnek (folyamban, nem memoriaban), ott
 * ellenorizzuk a meretet es a tipust, majd a kesz fajl a videotarolora kerul.
 */
final class LocalChunkedVideoUploader implements VideoUploader
{
    private const MB = 1024 * 1024;

    public function __construct(private readonly VideoSniffer $sniffer) {}

    public function begin(Lesson $lesson, ?User $user, string $filename, int $size): LessonUpload
    {
        $maxMb = Config::integer('catalog.video.max_size_mb');
        if ($size > $maxMb * self::MB) {
            throw InvalidVideoUpload::tooLarge($maxMb);
        }

        $partSize = Config::integer('catalog.video.part_size_mb') * self::MB;

        return LessonUpload::create([
            'lesson_id' => $lesson->id,
            'user_id' => $user?->id,
            'filename' => $filename,
            'size' => $size,
            'part_size' => $partSize,
            'total_parts' => (int) ceil($size / $partSize),
        ]);
    }

    public function receivePart(LessonUpload $upload, int $number, string $bytes): void
    {
        if ($number < 1 || $number > $upload->total_parts) {
            throw InvalidVideoUpload::partOutOfRange($number, $upload->total_parts);
        }

        $expected = $upload->expectedPartLength($number);
        if (strlen($bytes) !== $expected) {
            throw InvalidVideoUpload::partWrongLength($number, $expected);
        }

        // Az elso darabbol mar kiderul, hogy nem video: nem kell vegigvarni az egesz feltoltest.
        if ($number === 1 && $this->sniffer->extensionOfBytes($bytes) === null) {
            throw InvalidVideoUpload::unsupportedType();
        }

        $this->staging()->put($this->partPath($upload, $number), $bytes);
    }

    public function receivedParts(LessonUpload $upload): array
    {
        $numbers = array_map(
            static fn (string $path): int => (int) pathinfo($path, PATHINFO_FILENAME),
            $this->staging()->files($this->directory($upload)),
        );
        sort($numbers);

        return $numbers;
    }

    public function complete(LessonUpload $upload): StoredVideo
    {
        $missing = array_values(array_diff(range(1, $upload->total_parts), $this->receivedParts($upload)));
        if ($missing !== []) {
            throw InvalidVideoUpload::incomplete($missing);
        }

        $assembled = $this->assemble($upload);

        try {
            if (filesize($assembled) !== $upload->size) {
                throw InvalidVideoUpload::sizeMismatch($upload->size);
            }

            $extension = $this->sniffer->extensionOfFile($assembled) ?? throw InvalidVideoUpload::unsupportedType();
            $path = sprintf('lessons/%d/%s.%s', $upload->lesson_id, Str::lower(Str::random(40)), $extension);

            $stream = fopen($assembled, 'rb');
            if ($stream === false) {
                throw new RuntimeException('Cannot read the assembled video file.');
            }

            try {
                $this->videos()->writeStream($path, $stream);
            } finally {
                fclose($stream);
            }

            return new StoredVideo($path, $upload->size);
        } finally {
            @unlink($assembled);
        }
    }

    public function discard(LessonUpload $upload): void
    {
        $this->staging()->deleteDirectory($this->directory($upload));
        $upload->delete();
    }

    public function pruneStale(): int
    {
        $stale = LessonUpload::query()
            ->where('created_at', '<', Carbon::now()->subHours(Config::integer('catalog.video.upload_ttl_hours')))
            ->get();

        foreach ($stale as $upload) {
            $this->discard($upload);
        }

        return $stale->count();
    }

    /** A darabok osszefuzese egy ideiglenes fajlba, darabonkent, a memoria kimelesevel. */
    private function assemble(LessonUpload $upload): string
    {
        $target = tempnam(sys_get_temp_dir(), 'lessonvideo');
        $output = $target === false ? false : fopen($target, 'wb');
        if ($target === false || $output === false) {
            throw new RuntimeException('Cannot create a temporary file for the video upload.');
        }

        try {
            for ($number = 1; $number <= $upload->total_parts; $number++) {
                $part = $this->staging()->readStream($this->partPath($upload, $number));
                if ($part === null) {
                    throw new RuntimeException("Upload part {$number} disappeared.");
                }

                try {
                    stream_copy_to_stream($part, $output);
                } finally {
                    fclose($part);
                }
            }
        } finally {
            fclose($output);
        }

        return $target;
    }

    private function directory(LessonUpload $upload): string
    {
        return $upload->id;
    }

    private function partPath(LessonUpload $upload, int $number): string
    {
        return $this->directory($upload).'/'.$number.'.part';
    }

    private function staging(): Filesystem
    {
        return Storage::disk('upload_staging');
    }

    private function videos(): Filesystem
    {
        return Storage::disk(Config::string('catalog.video.disk'));
    }
}
