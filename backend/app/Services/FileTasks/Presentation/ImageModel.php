<?php

declare(strict_types=1);

namespace App\Services\FileTasks\Presentation;

/**
 * Egy kep egy bemutatoban vagy vektorgrafikaban: a megjelenitett meret
 * milliméterben (a fajl nem tudja, hanyszoros a nagyitas a forrashoz kepest)
 * es a helyettesito szoveg.
 */
final readonly class ImageModel
{
    public function __construct(
        public ?float $widthMm,
        public ?float $heightMm,
        public ?string $altText,
        public int $slide = 1,
    ) {}

    public function aspectRatio(): ?float
    {
        return $this->widthMm !== null && $this->heightMm !== null && $this->heightMm > 0.0
            ? $this->widthMm / $this->heightMm
            : null;
    }
}
