<?php

declare(strict_types=1);

namespace App\Services\FileTasks\Grammar;

use Illuminate\Support\Facades\Config;

/**
 * Hosszusagok az ertekelolap nyelvtanaban: szam es mertekegyseg (`cm`, `mm`,
 * `pt`, `in`), tizedesvesszovel vagy tizedesponttal. A kozos alak milliméter;
 * ket hossz egyezik, ha az elteresuk legfeljebb `filetasks.length_tolerance_mm`.
 */
final class Lengths
{
    private const MILLIMETRES_PER = [
        'mm' => 1.0,
        'cm' => 10.0,
        'in' => 25.4,
        'pt' => 25.4 / 72,
    ];

    /** A hossz milliméterben, vagy null, ha a szoveg nem mertekegyseges hossz. */
    public static function toMillimetres(string $text): ?float
    {
        if (preg_match('/^\s*([+-]?\d+(?:[.,]\d+)?)\s*(mm|cm|in|pt)\s*$/i', $text, $match) !== 1) {
            return null;
        }

        return (float) str_replace(',', '.', $match[1]) * self::MILLIMETRES_PER[strtolower($match[2])];
    }

    public static function close(float $leftMillimetres, float $rightMillimetres): bool
    {
        return abs($leftMillimetres - $rightMillimetres) <= Config::float('filetasks.length_tolerance_mm');
    }

    /** Megjelenites a diaknak centimeterben, ket tizedesjegyig ("2,5 cm"). */
    public static function format(float $millimetres): string
    {
        return Numbers::format(round($millimetres / 10, 2)).' cm';
    }
}
