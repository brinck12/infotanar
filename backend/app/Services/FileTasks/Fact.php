<?php

declare(strict_types=1);

namespace App\Services\FileTasks;

/**
 * Egy adat arrol, amit az olvaso a fajlban talalt (pl. "Lapméret": "A4, álló").
 * A cimke es az ertek is a diaknak szolo, rovid magyar szoveg.
 */
final readonly class Fact
{
    public function __construct(
        public string $label,
        public string $value,
    ) {}

    /** @return array{label: string, value: string} A beadas eredmenyeben (`facts`) tarolt alak. */
    public function toArray(): array
    {
        return ['label' => $this->label, 'value' => $this->value];
    }
}
