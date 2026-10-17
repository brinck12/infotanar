<?php

declare(strict_types=1);

namespace App\Services\Catalog\Content;

/** Egy beolvasott feladatfájl; az `$attributes` kulcsai már adatbázis-mezőnevek. */
final readonly class ExerciseNode
{
    /**
     * @param  array<string, mixed>  $attributes
     * @param  list<array{stdin: string, expected_stdout: string, is_hidden: bool, order: int}>  $testCases
     * @param  array<string, ContentFile>  $files  közös adatfájlok (`files:`), fájlnév szerint
     * @param  array<int, array<string, ContentFile>>  $testFiles  tesztesetenkénti bemeneti fájlok a teszteset `order` indexe szerint
     */
    public function __construct(
        public string $path,
        public array $attributes,
        public array $testCases,
        public array $files = [],
        public array $testFiles = [],
    ) {}
}
