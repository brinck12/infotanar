<?php

declare(strict_types=1);

namespace App\Services\FileTasks\Document;

/** Egy beágyazott kép. `wrap`: inline | square | tight | through | topbottom | behind | front | none. */
final readonly class ImageInfo
{
    public function __construct(
        public float $widthMm,
        public float $heightMm,
        public string $wrap,
        public string $altText,
    ) {}
}
