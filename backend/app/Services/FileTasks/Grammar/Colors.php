<?php

declare(strict_types=1);

namespace App\Services\FileTasks\Grammar;

/**
 * Szinek az ertekelolap nyelvtanaban: `#RRGGBB` vagy egy magyar szinnev. A
 * kanonikus alak hat nagybetus hexa jegy, kettoskereszt nelkul ("FF0000").
 */
final class Colors
{
    /** A nyelvtan szinnevei (ekezet nelkul, ahogy a Text::fold adja) => kanonikus szin. */
    private const NAMES = [
        'piros' => 'FF0000',
        'zold' => '00FF00',
        'kek' => '0000FF',
        'fekete' => '000000',
        'feher' => 'FFFFFF',
        'sarga' => 'FFFF00',
        'narancs' => 'FFA500',
        'szurke' => '808080',
    ];

    /**
     * Csatornankent ekkora elteres meg egyezes: a programok "piros"-a nem
     * mindig pontosan FF0000 (pl. a sotetebb alapzold 00B050 mar nem zold).
     */
    private const CHANNEL_TOLERANCE = 16;

    /** Az elvart szin kanonikus alakja, vagy null, ha nem szin. */
    public static function parse(string $text): ?string
    {
        $text = trim($text);

        if (preg_match('/^#?([0-9a-fA-F]{6})$/', $text, $match) === 1) {
            return strtoupper($match[1]);
        }

        // Excel ARGB (FFRRGGBB): az elso ket jegy az atlatszosag.
        if (preg_match('/^#?[0-9a-fA-F]{2}([0-9a-fA-F]{6})$/', $text, $match) === 1) {
            return strtoupper($match[1]);
        }

        if (preg_match('/^#([0-9a-fA-F])([0-9a-fA-F])([0-9a-fA-F])$/', $text, $match) === 1) {
            return strtoupper($match[1].$match[1].$match[2].$match[2].$match[3].$match[3]);
        }

        return self::NAMES[Text::fold($text)] ?? null;
    }

    /** Ket kanonikus szin egyezik-e a csatornankenti turessel. */
    public static function close(string $left, string $right): bool
    {
        foreach ([0, 2, 4] as $offset) {
            if (abs(hexdec(substr($left, $offset, 2)) - hexdec(substr($right, $offset, 2))) > self::CHANNEL_TOLERANCE) {
                return false;
            }
        }

        return true;
    }

    /** Megjelenites a diaknak: "#FF0000". */
    public static function format(string $color): string
    {
        return '#'.strtoupper($color);
    }
}
