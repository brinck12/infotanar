<?php

declare(strict_types=1);

namespace App\Services\FileTasks\Web;

use App\Services\FileTasks\Grammar\Colors;

/**
 * CSS/SVG szinertekek RRGGBB-ra: #rgb, #rrggbb, rgb(), rgba(), az alapszinnevek
 * (angolul) es a vizsgalatok magyar szinnevei. Ami ismeretlen (var(), url(),
 * hsl(), currentColor), arra null.
 */
final class CssColors
{
    private const NAMES = [
        'black' => '000000', 'white' => 'FFFFFF', 'red' => 'FF0000', 'lime' => '00FF00', 'green' => '008000',
        'blue' => '0000FF', 'yellow' => 'FFFF00', 'cyan' => '00FFFF', 'aqua' => '00FFFF', 'magenta' => 'FF00FF',
        'fuchsia' => 'FF00FF', 'orange' => 'FFA500', 'gray' => '808080', 'grey' => '808080', 'silver' => 'C0C0C0',
        'maroon' => '800000', 'olive' => '808000', 'navy' => '000080', 'purple' => '800080', 'teal' => '008080',
        'pink' => 'FFC0CB', 'brown' => 'A52A2A', 'gold' => 'FFD700', 'darkgray' => 'A9A9A9', 'darkgrey' => 'A9A9A9',
        'lightgray' => 'D3D3D3', 'lightgrey' => 'D3D3D3', 'darkblue' => '00008B', 'darkgreen' => '006400',
        'darkred' => '8B0000', 'lightblue' => 'ADD8E6', 'lightgreen' => '90EE90', 'skyblue' => '87CEEB',
        'tomato' => 'FF6347', 'coral' => 'FF7F50', 'crimson' => 'DC143C', 'indigo' => '4B0082', 'violet' => 'EE82EE',
        'turquoise' => '40E0D0', 'beige' => 'F5F5DC', 'ivory' => 'FFFFF0', 'khaki' => 'F0E68C', 'salmon' => 'FA8072',
    ];

    public static function parse(string $value): ?string
    {
        $text = strtolower(trim($value));

        if ($text === '' || $text === 'transparent') {
            return null;
        }

        if (preg_match('/^rgba?\(\s*(\d{1,3}(?:\.\d+)?%?)\s*[, ]\s*(\d{1,3}(?:\.\d+)?%?)\s*[, ]\s*(\d{1,3}(?:\.\d+)?%?)\s*(?:[,\/]\s*[\d.]+%?\s*)?\)$/', $text, $match) === 1) {
            $channels = [];

            foreach ([1, 2, 3] as $index) {
                $channel = $match[$index];
                $number = (float) rtrim($channel, '%');
                $channels[] = (int) round(str_ends_with($channel, '%') ? $number * 2.55 : $number);
            }

            return strtoupper(sprintf('%02x%02x%02x', ...array_map(static fn (int $channel): int => max(0, min(255, $channel)), $channels)));
        }

        if (isset(self::NAMES[$text])) {
            return self::NAMES[$text];
        }

        if (preg_match('/^#?[0-9a-f]{3}$|^#?[0-9a-f]{6}$/', $text) === 1 && str_starts_with($text, '#')) {
            return Colors::parse($text);
        }

        return null;
    }
}
