<?php

declare(strict_types=1);

namespace App\Services\FileTasks\Web;

/**
 * Egy CSS-szabaly egyetlen szelektorral (a `h1, h2 { }` ket szabaly). A
 * `media` az at-szabaly eloszava (pl. "(max-width: 600px)"), vagy null, ha a
 * szabaly feltetel nelkul ervenyes.
 */
final readonly class CssRule
{
    /**
     * @param  list<array{0: string, 1: string, 2: bool}>  $declarations  [tulajdonsag, ertek, !important]
     */
    public function __construct(
        public string $selector,
        public array $declarations,
        public ?string $media = null,
    ) {}
}
