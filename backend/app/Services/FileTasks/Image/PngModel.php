<?php

declare(strict_types=1);

namespace App\Services\FileTasks\Image;

use App\Services\FileTasks\Fact;
use App\Services\FileTasks\OpenedFile;
use App\Services\FileTasks\Presentation\Message;

/**
 * Egy megnyitott png: kepponteses meret es (ha a fajl megadja) a felbontas.
 * A `dpi` null, ha nincs pHYs adat; a hosszusag-osszehasonlitas ilyenkor 96 dpi-vel szamol.
 */
final readonly class PngModel implements OpenedFile
{
    public function __construct(
        public int $width,
        public int $height,
        public ?float $dpi,
    ) {}

    /** @return list<Fact> */
    public function facts(): array
    {
        return [new Fact(Message::get('fact_image_size'), $this->width.' × '.$this->height.' px')];
    }
}
