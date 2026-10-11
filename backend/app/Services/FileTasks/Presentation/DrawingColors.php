<?php

declare(strict_types=1);

namespace App\Services\FileTasks\Presentation;

use DOMElement;
use DOMNode;

/**
 * DrawingML szinek feloldasa (srgbClr, schemeClr, sysClr, prstClr) a tema es a
 * szinleképezés (clrMap) alapjan. A lumMod/lumOff (vilagositas, sotetites)
 * atalakitast alkalmazza, az alpha-bol atlatszosagot szamol.
 */
final class DrawingColors
{
    private const PRESET = [
        'black' => '000000', 'white' => 'FFFFFF', 'red' => 'FF0000', 'green' => '008000',
        'blue' => '0000FF', 'yellow' => 'FFFF00', 'orange' => 'FFA500', 'gray' => '808080', 'grey' => '808080',
    ];

    private const COLOR_ELEMENTS = ['srgbClr', 'schemeClr', 'sysClr', 'prstClr', 'hslClr', 'scrgbClr'];

    /**
     * A $holder (pl. solidFill) elso szin-gyermeke: [RRGGBB vagy null, atlatszosag % vagy null].
     *
     * @param  array<string, string>  $theme  tema szinnev => RRGGBB (dk1, lt1, accent1...)
     * @param  array<string, string>  $clrMap  pl. bg1 => lt1
     * @return array{hex: string|null, transparency: float|null}|null null, ha nincs szin-gyermek
     */
    public static function resolve(?DOMNode $holder, array $theme, array $clrMap, ?string $placeholder = null): ?array
    {
        $element = self::colorElement($holder);

        if ($element === null) {
            return null;
        }

        $hex = match ($element->localName) {
            'srgbClr' => self::hex($element->getAttribute('val')),
            'sysClr' => self::hex($element->getAttribute('lastClr')) ?? ($element->getAttribute('val') === 'window' ? 'FFFFFF' : '000000'),
            'prstClr' => self::PRESET[strtolower($element->getAttribute('val'))] ?? null,
            'schemeClr' => self::scheme($element->getAttribute('val'), $theme, $clrMap, $placeholder),
            default => null,
        };

        $transparency = null;
        $lumMod = 1.0;
        $lumOff = 0.0;

        foreach ($element->childNodes as $child) {
            if (! $child instanceof DOMElement) {
                continue;
            }

            $value = (float) $child->getAttribute('val') / 100000;

            match ($child->localName) {
                'alpha' => $transparency = round((1 - $value) * 100, 2),
                'lumMod' => $lumMod = $value,
                'lumOff' => $lumOff = $value,
                default => null,
            };
        }

        if ($hex !== null && ($lumMod !== 1.0 || $lumOff !== 0.0)) {
            $hex = self::adjustLuminance($hex, $lumMod, $lumOff);
        }

        return ['hex' => $hex, 'transparency' => $transparency];
    }

    private static function colorElement(?DOMNode $holder): ?DOMElement
    {
        if ($holder === null) {
            return null;
        }

        foreach ($holder->childNodes as $child) {
            if ($child instanceof DOMElement && in_array($child->localName, self::COLOR_ELEMENTS, true)) {
                return $child;
            }
        }

        return null;
    }

    /**
     * @param  array<string, string>  $theme
     * @param  array<string, string>  $clrMap
     */
    private static function scheme(string $name, array $theme, array $clrMap, ?string $placeholder): ?string
    {
        if ($name === 'phClr') {
            return $placeholder;
        }

        return $theme[$clrMap[$name] ?? $name] ?? null;
    }

    private static function hex(string $value): ?string
    {
        return preg_match('/^[0-9a-fA-F]{6}$/', $value) === 1 ? strtoupper($value) : null;
    }

    private static function adjustLuminance(string $hex, float $mod, float $off): string
    {
        [$red, $green, $blue] = [hexdec(substr($hex, 0, 2)) / 255, hexdec(substr($hex, 2, 2)) / 255, hexdec(substr($hex, 4, 2)) / 255];
        $max = max($red, $green, $blue);
        $min = min($red, $green, $blue);
        $lightness = ($max + $min) / 2;
        $delta = $max - $min;
        $saturation = 0.0;
        $hue = 0.0;

        if ($delta > 0.0) {
            $saturation = $lightness > 0.5 ? $delta / (2 - $max - $min) : $delta / ($max + $min);
            $hue = match (true) {
                $max === $red => fmod(($green - $blue) / $delta + 6, 6),
                $max === $green => ($blue - $red) / $delta + 2,
                default => ($red - $green) / $delta + 4,
            } / 6;
        }

        $lightness = min(1.0, max(0.0, $lightness * $mod + $off));
        $q = $lightness < 0.5 ? $lightness * (1 + $saturation) : $lightness + $saturation - $lightness * $saturation;
        $p = 2 * $lightness - $q;
        $channel = static function (float $t) use ($p, $q): int {
            $t = $t < 0 ? $t + 1 : ($t > 1 ? $t - 1 : $t);
            $value = match (true) {
                $t < 1 / 6 => $p + ($q - $p) * 6 * $t,
                $t < 1 / 2 => $q,
                $t < 2 / 3 => $p + ($q - $p) * (2 / 3 - $t) * 6,
                default => $p,
            };

            return (int) round($value * 255);
        };

        if ($saturation === 0.0) {
            $gray = (int) round($lightness * 255);

            return strtoupper(sprintf('%02x%02x%02x', $gray, $gray, $gray));
        }

        return strtoupper(sprintf('%02x%02x%02x', $channel($hue + 1 / 3), $channel($hue), $channel($hue - 1 / 3)));
    }
}
