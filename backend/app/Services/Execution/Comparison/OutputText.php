<?php

declare(strict_types=1);

namespace App\Services\Execution\Comparison;

/** A kimenet felbontasa az osszehasonlitok kozos szabalyai szerint. */
final class OutputText
{
    /**
     * Sorok: a sorvegi szokozok nelkul, a zaro ures sorok nelkul (az erettsegi-feladatoknal ezek
     * nem relevans elteresek). `$dropBlankLines`: a belso ures sorok is elhagyhatok.
     *
     * @return list<string>
     */
    public static function lines(string $text, bool $caseInsensitive, bool $dropBlankLines = false): array
    {
        $lines = array_map(rtrim(...), explode("\n", str_replace("\r\n", "\n", self::fold($text, $caseInsensitive))));

        if ($dropBlankLines) {
            return array_values(array_filter($lines, static fn (string $line): bool => $line !== ''));
        }

        while ($lines !== [] && end($lines) === '') {
            array_pop($lines);
        }

        return $lines;
    }

    /**
     * Elemek: barmilyen szokozzel (szokoz, tabulator, sortores) elvalasztott szavak.
     *
     * @return list<string>
     */
    public static function tokens(string $text, bool $caseInsensitive): array
    {
        $tokens = preg_split('/\s+/u', trim(self::fold($text, $caseInsensitive)), flags: PREG_SPLIT_NO_EMPTY);

        return $tokens === false ? [] : $tokens;
    }

    private static function fold(string $text, bool $caseInsensitive): string
    {
        return $caseInsensitive ? mb_strtolower($text) : $text;
    }
}
