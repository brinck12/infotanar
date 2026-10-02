<?php

declare(strict_types=1);

namespace App\Services\Catalog\Media;

/** A videotarolora kerult, kesz videofajl. */
final readonly class StoredVideo
{
    public function __construct(
        /** Relativ utvonal a videotaroloban (`lessons/{id}/{veletlen}.{ext}`). */
        public string $path,
        public int $size,
    ) {}
}
