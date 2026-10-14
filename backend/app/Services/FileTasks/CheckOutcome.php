<?php

declare(strict_types=1);

namespace App\Services\FileTasks;

/**
 * Egy vizsgalat eredmenye: teljesult-e, es mit talalt a kezelo a fajlban.
 *
 * A `found` a diaknak szolo rovid magyar szoveg ("B2:B40 növekvő", "A4,
 * fekvő"); null, ha nem volt mit vizsgalni. A beadas eredmenyeben a pont
 * `found` mezoje lesz, legfeljebb 200 karakterrel.
 */
final readonly class CheckOutcome
{
    public const MAX_FOUND_LENGTH = 200;

    public ?string $found;

    public function __construct(
        public bool $passed,
        ?string $found = null,
    ) {
        $found = $found === null ? null : trim($found);

        $this->found = $found === null || $found === ''
            ? null
            : mb_strimwidth($found, 0, self::MAX_FOUND_LENGTH, '…', 'UTF-8');
    }

    public static function pass(?string $found = null): self
    {
        return new self(true, $found);
    }

    public static function fail(?string $found = null): self
    {
        return new self(false, $found);
    }
}
