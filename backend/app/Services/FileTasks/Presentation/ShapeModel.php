<?php

declare(strict_types=1);

namespace App\Services\FileTasks\Presentation;

/**
 * Egy alakzat egy dian (pptx, odp) vagy egy svg-ben: a Vocabulary szerinti
 * fajtaja, kitoltese, atlatszosaga es szovege.
 *
 * A `fill` lehet "RRGGBB", "none" (nincs kitoltes), "gradient", "image",
 * vagy null, ha a fajl nem mond semmit.
 */
final readonly class ShapeModel
{
    public function __construct(
        public string $kind,
        public ?string $fill,
        public ?float $transparency,
        public string $text,
        public ?string $id = null,
        public ?ImageModel $image = null,
    ) {}
}
