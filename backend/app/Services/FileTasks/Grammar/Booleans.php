<?php

declare(strict_types=1);

namespace App\Services\FileTasks\Grammar;

/** Logikai ertekek az ertekelolap nyelvtanaban: `igen|nem|true|false` (es `igaz|hamis`). */
final class Booleans
{
    private const TRUE = ['igen', 'true', 'igaz'];

    private const FALSE = ['nem', 'false', 'hamis'];

    public static function parse(string $text): ?bool
    {
        $folded = Text::fold($text);

        return match (true) {
            in_array($folded, self::TRUE, true) => true,
            in_array($folded, self::FALSE, true) => false,
            default => null,
        };
    }

    /** Megjelenites a diaknak. */
    public static function format(bool $value): string
    {
        return $value ? 'igen' : 'nem';
    }
}
