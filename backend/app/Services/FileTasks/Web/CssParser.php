<?php

declare(strict_types=1);

namespace App\Services\FileTasks\Web;

/**
 * Kis, elnezo CSS-ertelmezo: kommentek, @media/@supports blokkok (a szabalyaik
 * a feltetelukkel egyutt megmaradnak), egyeb at-szabalyok (@keyframes,
 *
 * @font-face, @import...) kihagyva. Hibas CSS-nel nem dob kivetelt: ami nem
 * ertelmezheto, azt kihagyja.
 *
 * A szelektorlistat szabalyonkent egy szelektorra bontja, az egyszeru
 * szelektorokat (tag, .osztaly, #id, tag.osztaly) pedig egységes alakra hozza.
 */
final class CssParser
{
    private const MAX_RULES = 20000;

    private const MAX_DEPTH = 4;

    /** @return list<CssRule> */
    public function parse(string $css): array
    {
        $css = preg_replace('~/\*.*?\*/~s', '', $css) ?? $css;
        $rules = [];
        $this->block($css, null, 0, $rules);

        return $rules;
    }

    /** @param list<CssRule> $rules */
    private function block(string $css, ?string $media, int $depth, array &$rules): void
    {
        $length = strlen($css);
        $position = 0;

        while ($position < $length && count($rules) < self::MAX_RULES) {
            $open = $this->find($css, '{', $position);
            $semicolon = $this->find($css, ';', $position);

            if ($semicolon !== null && ($open === null || $semicolon < $open)) {
                // Blokk nelkuli at-szabaly (@import, @charset) vagy elarvult deklaracio.
                $position = $semicolon + 1;

                continue;
            }

            if ($open === null) {
                return;
            }

            $prelude = trim(substr($css, $position, $open - $position));
            $close = $this->matching($css, $open);
            $body = substr($css, $open + 1, ($close ?? $length) - $open - 1);
            $position = ($close ?? $length) + 1;

            if (str_starts_with($prelude, '@')) {
                $name = strtolower((string) preg_replace('/^@([a-zA-Z-]+).*$/s', '$1', $prelude));

                if (($name === 'media' || $name === 'supports') && $depth < self::MAX_DEPTH) {
                    $this->block($body, trim((string) preg_replace('/^@\w+\s*/', '', $prelude)), $depth + 1, $rules);
                }

                continue;
            }

            $declarations = $this->declarations($body);

            foreach (explode(',', $prelude) as $selector) {
                $normalised = self::normaliseSelector($selector);

                if ($normalised !== '') {
                    $rules[] = new CssRule($normalised, $declarations, $media);
                }
            }
        }
    }

    /** A szelektor egységes alakja: felesleges szokozok nelkul, a tag kisbetus. */
    public static function normaliseSelector(string $selector): string
    {
        $selector = trim((string) preg_replace('/\s+/', ' ', $selector));

        if (preg_match('/^([A-Za-z][A-Za-z0-9]*)(.*)$/', $selector, $match) === 1) {
            return strtolower($match[1]).$match[2];
        }

        return $selector;
    }

    /** @return list<array{0: string, 1: string, 2: bool}> */
    private function declarations(string $body): array
    {
        $declarations = [];

        foreach ($this->splitTopLevel($body, ';') as $part) {
            $colon = strpos($part, ':');

            if ($colon === false) {
                continue;
            }

            $property = strtolower(trim(substr($part, 0, $colon)));
            $value = trim((string) preg_replace('/\s+/', ' ', substr($part, $colon + 1)));
            $important = false;

            if (preg_match('/\s*!\s*important$/i', $value) === 1) {
                $important = true;
                $value = trim((string) preg_replace('/\s*!\s*important$/i', '', $value));
            }

            if (preg_match('/^-{0,2}[a-z][a-z0-9-]*$/', $property) === 1 && $value !== '') {
                $declarations[] = [$property, $value, $important];
            }
        }

        return $declarations;
    }

    /** @return list<string> */
    private function splitTopLevel(string $text, string $separator): array
    {
        $parts = [];
        $current = '';
        $depth = 0;
        $quote = null;
        $length = strlen($text);

        for ($index = 0; $index < $length; $index++) {
            $char = $text[$index];

            if ($quote !== null) {
                $current .= $char;

                if ($char === $quote) {
                    $quote = null;
                }

                continue;
            }

            if ($char === '"' || $char === "'") {
                $quote = $char;
            } elseif ($char === '(') {
                $depth++;
            } elseif ($char === ')' && $depth > 0) {
                $depth--;
            } elseif ($char === $separator && $depth === 0) {
                $parts[] = $current;
                $current = '';

                continue;
            }

            $current .= $char;
        }

        $parts[] = $current;

        return $parts;
    }

    /** A kovetkezo $needle poziciója a stringeken es zarojeleken kivul; null, ha nincs. */
    private function find(string $css, string $needle, int $from): ?int
    {
        $length = strlen($css);
        $quote = null;
        $depth = 0;

        for ($index = $from; $index < $length; $index++) {
            $char = $css[$index];

            if ($quote !== null) {
                if ($char === $quote) {
                    $quote = null;
                }

                continue;
            }

            if ($char === '"' || $char === "'") {
                $quote = $char;
            } elseif ($char === '(') {
                $depth++;
            } elseif ($char === ')' && $depth > 0) {
                $depth--;
            } elseif ($char === $needle && $depth === 0) {
                return $index;
            } elseif ($needle === ';' && $char === '{') {
                // Egy blokk kezdete elott nincs ';' - nem kell tovabb keresni.
                return null;
            }
        }

        return null;
    }

    /** A $open pozicioju '{' parja; null, ha nincs lezarva. */
    private function matching(string $css, int $open): ?int
    {
        $length = strlen($css);
        $depth = 0;
        $quote = null;

        for ($index = $open; $index < $length; $index++) {
            $char = $css[$index];

            if ($quote !== null) {
                if ($char === $quote) {
                    $quote = null;
                }

                continue;
            }

            if ($char === '"' || $char === "'") {
                $quote = $char;
            } elseif ($char === '{') {
                $depth++;
            } elseif ($char === '}') {
                $depth--;

                if ($depth === 0) {
                    return $index;
                }
            }
        }

        return null;
    }
}
