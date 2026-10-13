<?php

declare(strict_types=1);

namespace App\Services\FileTasks\Presentation;

/**
 * Egy animacios effektus egy dian. A `class` az effektus fajtaja
 * (entrance, exit, emphasis, path), a `trigger` pedig click, with vagy after.
 */
final readonly class AnimationModel
{
    public function __construct(
        public string $effect,
        public string $class,
        public string $trigger,
        public ?float $durationSeconds,
        public float $delaySeconds,
        public ?string $shapeId,
    ) {}
}
