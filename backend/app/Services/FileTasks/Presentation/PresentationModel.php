<?php

declare(strict_types=1);

namespace App\Services\FileTasks\Presentation;

use App\Services\FileTasks\Fact;
use App\Services\FileTasks\Grammar\Lengths;
use App\Services\FileTasks\OpenedFile;

/**
 * Egy megnyitott bemutato (pptx vagy odp): meret, diak, a minta (master)
 * betutipusai es az ismetles. Csak olvashato; minden vizsgalat ezen fut.
 */
final readonly class PresentationModel implements OpenedFile
{
    /**
     * @param  list<SlideModel>  $slides
     */
    public function __construct(
        public float $widthMm,
        public float $heightMm,
        public array $slides,
        public ?string $titleFont,
        public ?string $bodyFont,
        public bool $loop,
    ) {}

    public function slide(int $number): ?SlideModel
    {
        return $this->slides[$number - 1] ?? null;
    }

    /**
     * Az osszes kep sorrendben (diankent, azon belul alakzatonkent).
     *
     * @return list<ImageModel>
     */
    public function images(): array
    {
        $images = [];

        foreach ($this->slides as $slide) {
            foreach ($slide->shapes as $shape) {
                if ($shape->image !== null) {
                    $images[] = $shape->image;
                }
            }
        }

        return $images;
    }

    /** @return list<Fact> */
    public function facts(): array
    {
        $layouts = array_values(array_unique(array_filter(
            array_map(static fn (SlideModel $slide): ?string => $slide->layout, $this->slides),
            static fn (?string $layout): bool => $layout !== null && $layout !== '',
        )));

        $facts = [
            new Fact(Message::get('fact_slides'), (string) count($this->slides)),
            new Fact(Message::get('fact_size'), Lengths::format($this->widthMm).' × '.Lengths::format($this->heightMm)),
        ];

        if ($layouts !== []) {
            $facts[] = new Fact(Message::get('fact_layouts'), implode(', ', array_slice($layouts, 0, 6)));
        }

        return $facts;
    }
}
