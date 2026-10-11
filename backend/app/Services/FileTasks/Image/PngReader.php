<?php

declare(strict_types=1);

namespace App\Services\FileTasks\Image;

use App\Services\Files\PrivateFileStore;
use App\Services\Files\StoredFile;
use App\Services\Files\UploadedFileInspector;
use App\Services\FileTasks\FileReader;
use App\Services\FileTasks\OpenedFile;
use App\Services\FileTasks\UnreadableFile;
use Illuminate\Contracts\Filesystem\FileNotFoundException;
use LengthException;

/**
 * A png olvasoja: a meretet az IHDR blokkbol veszi (nincs ext-gd), a
 * felbontast a pHYs blokkbol. A blokkokat vegigjarja IEND-ig, es a csonka
 * vagy hibas CRC-jű fajlt olvashatatlannak veszi.
 */
final readonly class PngReader implements FileReader
{
    private const SIGNATURE = "\x89PNG\r\n\x1a\n";

    private const MAX_DIMENSION = 100_000;

    private const METRES_PER_INCH = 0.0254;

    public function __construct(private PrivateFileStore $files) {}

    /** @return list<string> */
    public function extensions(): array
    {
        return ['.png'];
    }

    public function open(StoredFile $file): OpenedFile
    {
        try {
            $bytes = $this->files->bytes($file, UploadedFileInspector::maxBytesFor('image'));
        } catch (FileNotFoundException|LengthException $exception) {
            throw new UnreadableFile('A png nem olvashato.', $exception);
        }

        if (! str_starts_with($bytes, self::SIGNATURE)) {
            throw new UnreadableFile('Nem png a fajl.');
        }

        $length = strlen($bytes);
        $offset = 8;
        $width = 0;
        $height = 0;
        $dpi = null;
        $ended = false;

        while ($offset + 12 <= $length) {
            $size = $this->uint32($bytes, $offset);
            $type = substr($bytes, $offset + 4, 4);

            if ($offset + 12 + $size > $length) {
                throw new UnreadableFile('Csonka png.');
            }

            $data = substr($bytes, $offset + 8, $size);

            if ($this->uint32($bytes, $offset + 8 + $size) !== crc32($type.$data)) {
                throw new UnreadableFile('Hibas png blokk.');
            }

            if ($type === 'IHDR' && $size === 13 && $width === 0) {
                $width = $this->uint32($data, 0);
                $height = $this->uint32($data, 4);
            } elseif ($width === 0) {
                throw new UnreadableFile('Hianyzik a png fejlece.');
            } elseif ($type === 'pHYs' && $size === 9 && ord($data[8]) === 1 && $this->uint32($data, 0) > 0) {
                $dpi = round($this->uint32($data, 0) * self::METRES_PER_INCH, 2);
            } elseif ($type === 'IEND') {
                $ended = true;

                break;
            }

            $offset += 12 + $size;
        }

        if (! $ended || $width < 1 || $height < 1 || $width > self::MAX_DIMENSION || $height > self::MAX_DIMENSION) {
            throw new UnreadableFile('Hibas vagy csonka png.');
        }

        return new PngModel($width, $height, $dpi);
    }

    private function uint32(string $bytes, int $offset): int
    {
        return (ord($bytes[$offset]) << 24) | (ord($bytes[$offset + 1]) << 16) | (ord($bytes[$offset + 2]) << 8) | ord($bytes[$offset + 3]);
    }
}
