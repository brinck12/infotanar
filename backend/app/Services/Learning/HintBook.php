<?php

declare(strict_types=1);

namespace App\Services\Learning;

use App\Models\ExerciseHint;
use Illuminate\Support\Collection;

/** Egy feladat tippjei egy diak szemszogebol: hany van, es melyeket kapta meg. */
final readonly class HintBook
{
    /** @param Collection<int, ExerciseHint> $revealed A megnyitott tippek, sorrendben. */
    public function __construct(
        public int $total,
        public Collection $revealed,
    ) {}
}
