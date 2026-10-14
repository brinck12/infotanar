<?php

declare(strict_types=1);

namespace App\Services\FileTasks\Vector;

use App\Services\FileTasks\Fact;
use App\Services\FileTasks\Grammar\Lengths;
use App\Services\FileTasks\OpenedFile;
use App\Services\FileTasks\Presentation\ImageModel;
use App\Services\FileTasks\Presentation\Message;
use App\Services\FileTasks\Presentation\ShapeModel;

/**
 * Egy megnyitott svg: a rajz merete (ha ismert), az alakzatok es a kepek.
 * A kepek (`<image>`) nem szamitanak alakzatnak.
 */
final readonly class SvgModel implements OpenedFile
{
    /**
     * @param  list<ShapeModel>  $shapes
     * @param  list<ImageModel>  $images
     */
    public function __construct(
        public ?float $widthMm,
        public ?float $heightMm,
        public array $shapes,
        public array $images,
    ) {}

    /** @return list<Fact> */
    public function facts(): array
    {
        $facts = [];

        if ($this->widthMm !== null && $this->heightMm !== null) {
            $facts[] = new Fact(Message::get('fact_size'), Lengths::format($this->widthMm).' × '.Lengths::format($this->heightMm));
        }

        $facts[] = new Fact(Message::get('fact_shapes'), (string) count($this->shapes));
        $facts[] = new Fact(Message::get('fact_images'), (string) count($this->images));

        return $facts;
    }
}
