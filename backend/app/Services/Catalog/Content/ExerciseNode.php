<?php

declare(strict_types=1);

namespace App\Services\Catalog\Content;

/** Egy beolvasott feladatfájl; az `$attributes` kulcsai már adatbázis-mezőnevek. */
final readonly class ExerciseNode
{
    /**
     * @param  array<string, mixed>  $attributes
     * @param  list<array{stdin: string, expected_stdout: string, is_hidden: bool, order: int}>  $testCases
     */
    public function __construct(
        public string $path,
        public array $attributes,
        public array $testCases,
    ) {}
}
