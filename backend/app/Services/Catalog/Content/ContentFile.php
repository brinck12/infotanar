<?php

declare(strict_types=1);

namespace App\Services\Catalog\Content;

/**
 * Egy feladathoz tartozó adatfájl a tartalmi mappában (`<feladat>.files/`): a futtatáskor a program
 * ezen a néven (`name`) látja. A tartalmat az import olvassa be; itt csak az útvonal, a méret és a hash van.
 */
final readonly class ContentFile
{
    public function __construct(
        public string $name,
        public string $path,
        public int $size,
        public string $sha256,
    ) {}
}
