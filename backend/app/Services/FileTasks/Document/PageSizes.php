<?php

declare(strict_types=1);

namespace App\Services\FileTasks\Document;

use App\Services\FileTasks\Grammar\Lengths;
use App\Services\FileTasks\Grammar\Text;

/** Szabványos lapméretek (rövidebb oldal x hosszabb oldal, mm). A tájolás nem számít. */
final class PageSizes
{
    /** @var array<string, array{float, float}> */
    private const SIZES = [
        'A3' => [297.0, 420.0],
        'A4' => [210.0, 297.0],
        'A5' => [148.0, 210.0],
        'B4' => [250.0, 353.0],
        'B5' => [176.0, 250.0],
        'Letter' => [215.9, 279.4],
        'Legal' => [215.9, 355.6],
    ];

    /** A lapméret szabványos neve, vagy null, ha nem szabványos. */
    public static function nameOf(float $widthMm, float $heightMm): ?string
    {
        foreach (self::SIZES as $name => [$short, $long]) {
            if (self::matches($widthMm, $heightMm, $short, $long)) {
                return $name;
            }
        }

        return null;
    }

    /** Illeszkedik-e a lap a névre ("A4", "Letter") a hossz-toleranciával, tájolástól függetlenül. */
    public static function isNamed(float $widthMm, float $heightMm, string $expected): bool
    {
        $size = self::lookup($expected);

        return $size !== null && self::matches($widthMm, $heightMm, $size[0], $size[1]);
    }

    public static function isKnownName(string $expected): bool
    {
        return self::lookup($expected) !== null;
    }

    /** @return array{float, float}|null */
    private static function lookup(string $name): ?array
    {
        $wanted = Text::fold($name);

        foreach (self::SIZES as $known => $size) {
            if (Text::fold($known) === $wanted) {
                return $size;
            }
        }

        return null;
    }

    private static function matches(float $widthMm, float $heightMm, float $short, float $long): bool
    {
        return Lengths::close(min($widthMm, $heightMm), $short) && Lengths::close(max($widthMm, $heightMm), $long);
    }
}
