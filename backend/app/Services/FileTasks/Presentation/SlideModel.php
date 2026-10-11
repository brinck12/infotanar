<?php

declare(strict_types=1);

namespace App\Services\FileTasks\Presentation;

/**
 * Egy dia: hatter, valtas, cimmeret, alakzatok es animaciok.
 *
 * `backgroundType`: solid, gradient, image vagy none; `backgroundColor` csak
 * egyszinu hatternel van. `transition` a Vocabulary kulcsa ("none", ha nincs).
 */
final readonly class SlideModel
{
    /**
     * @param  list<ShapeModel>  $shapes
     * @param  list<AnimationModel>  $animations
     */
    public function __construct(
        public int $number,
        public string $backgroundType,
        public ?string $backgroundColor,
        public string $transition,
        public ?float $titleSizePt,
        public bool $hasTitle,
        public array $shapes,
        public array $animations,
        public ?string $layout = null,
    ) {}
}
