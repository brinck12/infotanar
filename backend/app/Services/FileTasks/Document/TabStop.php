<?php

declare(strict_types=1);

namespace App\Services\FileTasks\Document;

/** Egy tabulatorallo: pozicio (mm), tipus (left|center|right|decimal|bar|clear) es kitoltes (none|dot|hyphen|underscore|middledot). */
final readonly class TabStop
{
    public function __construct(
        public float $positionMm,
        public string $type,
        public string $leader,
    ) {}
}
