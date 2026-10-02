<?php

declare(strict_types=1);

namespace App\Services\Catalog\Media;

use Carbon\CarbonImmutable;

/** Egy lecke video- vagy felirat-fajljanak allapota a tarolon (az admin latja, ha az utvonal lelog). */
final readonly class LessonMediaInfo
{
    public function __construct(
        public ?string $path,
        /** Letezik-e a fajl a taroloban; false = az utvonal "lelog" (a diak LessonVideoMissing-et kapna). */
        public bool $exists,
        public ?int $size,
        public ?CarbonImmutable $uploadedAt,
    ) {}

    /** Nincs hozzarendelt fajl. */
    public static function none(): self
    {
        return new self(null, false, null, null);
    }
}
