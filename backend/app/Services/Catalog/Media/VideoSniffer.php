<?php

declare(strict_types=1);

namespace App\Services\Catalog\Media;

use finfo;

/**
 * A videofajl tipusa a tartalmabol (libmagic), nem a fajlnevbol: egy atnevezett
 * szoveg- vagy futtathato fajl nem lehet "video.mp4" (#158). A tarolt kiterjesztes
 * is innen jon, nem a kliens altal megadott nevbol.
 */
final class VideoSniffer
{
    /** Az engedelyezett MIME-tipusok es a tarolt kiterjesztesuk. */
    private const ALLOWED = [
        'video/mp4' => 'mp4',
        'video/webm' => 'webm',
    ];

    /** @return string|null `mp4` vagy `webm`; null, ha a tartalom nem engedelyezett videotipus. */
    public function extensionOfBytes(string $bytes): ?string
    {
        return self::ALLOWED[(new finfo(FILEINFO_MIME_TYPE))->buffer($bytes)] ?? null;
    }

    /** @return string|null `mp4` vagy `webm`; null, ha a tartalom nem engedelyezett videotipus. */
    public function extensionOfFile(string $path): ?string
    {
        return self::ALLOWED[(new finfo(FILEINFO_MIME_TYPE))->file($path)] ?? null;
    }
}
