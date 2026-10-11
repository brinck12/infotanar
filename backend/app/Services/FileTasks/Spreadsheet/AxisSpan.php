<?php

declare(strict_types=1);

namespace App\Services\FileTasks\Spreadsheet;

/**
 * Egymas melletti oszlopok vagy sorok kozos merete es lathatosaga. A fajlok
 * savonkent taroljak ("az 1-16384. oszlop szelessege ennyi"), ezert mi is
 * savot tarolunk, nem oszloponkenti erteket.
 */
final readonly class AxisSpan
{
    public function __construct(
        /** Az elso es az utolso oszlop vagy sor, 1-tol szamozva. */
        public int $first,
        public int $last,
        /** Oszlopnal a szelesseg milliméterben, sornal a magassag pontban; null, ha a fajl nem adja meg. */
        public ?float $size,
        public bool $hidden = false,
    ) {}

    public function covers(int $index): bool
    {
        return $index >= $this->first && $index <= $this->last;
    }
}
