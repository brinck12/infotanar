<?php

declare(strict_types=1);

namespace App\Services\Execution\Comparison;

/** A kimenet felbontasa sorokra vagy elemekre, az osszehasonlitok kozos szabalyai szerint. */
final class OutputText
{
    /**
     * A magyar ekezetes betuk ekezet nelkuli parja. Az `õ` es az `û` a hibas
     * (Latin-1) kodolassal kiirt `ő` es `ű` szokasos alakja.
     *
     * Szandekosan nem Str::ascii: az minden at nem irhato karaktert eldob,
     * igy ket kulonbozo kimenet is egyezonek latszana.
     */
    private const ACCENTS = [
        'á' => 'a', 'é' => 'e', 'í' => 'i', 'ó' => 'o', 'ö' => 'o', 'ő' => 'o', 'õ' => 'o', 'ú' => 'u', 'ü' => 'u', 'ű' => 'u', 'û' => 'u',
        'Á' => 'A', 'É' => 'E', 'Í' => 'I', 'Ó' => 'O', 'Ö' => 'O', 'Ő' => 'O', 'Õ' => 'O', 'Ú' => 'U', 'Ü' => 'U', 'Ű' => 'U', 'Û' => 'U',
    ];

    /**
     * Sorok: a sorvegi szokozok es a zaro ures sorok nelkul, mert ezek az
     * erettsegi-feladatoknal nem relevans elteresek. Ha a beallitas keri, a
     * kozbulso ures sorok is kimaradnak.
     *
     * @return list<string>
     */
    public static function lines(string $text, ComparisonSettings $settings): array
    {
        $lines = array_map(rtrim(...), explode("\n", str_replace("\r\n", "\n", self::fold($text, $settings))));

        if ($settings->ignoreBlankLines) {
            return array_values(array_filter($lines, static fn (string $line): bool => $line !== ''));
        }

        while ($lines !== [] && end($lines) === '') {
            array_pop($lines);
        }

        return $lines;
    }

    /**
     * Elemek: szokozzel, tabulatorral vagy sortoressel elvalasztott szavak.
     *
     * @return list<string>
     */
    public static function tokens(string $text, ComparisonSettings $settings): array
    {
        // Bajtonkent, nem /u modban bontunk: a nem UTF-8 kimenetet (pl. Latin-2) is fel kell tudni bontani.
        $tokens = preg_split('/\s+/', self::fold($text, $settings), flags: PREG_SPLIT_NO_EMPTY);

        return $tokens === false ? [] : $tokens;
    }

    /** Az ekezetek elhagyasa a magyar abece betuirol; minden mas karakter valtozatlan. */
    public static function withoutAccents(string $text): string
    {
        return strtr($text, self::ACCENTS);
    }

    private static function fold(string $text, ComparisonSettings $settings): string
    {
        if ($settings->caseInsensitive) {
            $text = mb_strtolower($text);
        }

        return $settings->ignoreAccents ? self::withoutAccents($text) : $text;
    }
}
