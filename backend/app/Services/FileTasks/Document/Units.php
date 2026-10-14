<?php

declare(strict_types=1);

namespace App\Services\FileTasks\Document;

/**
 * Mertekegysegek atvaltasa a dokumentumformatumokbol. A kozos alak a
 * millimeter (hosszusag) es a pont (betumeret, terkoz).
 */
final class Units
{
    private const MM_PER_INCH = 25.4;

    public static function twipsToMillimetres(float $twips): float
    {
        return $twips / 1440 * self::MM_PER_INCH;
    }

    public static function twipsToPoints(float $twips): float
    {
        return $twips / 20;
    }

    /** EMU (OOXML rajzobjektumok): 36 000 EMU = 1 mm. */
    public static function emuToMillimetres(float $emu): float
    {
        return $emu / 36000;
    }

    public static function pointsToMillimetres(float $points): float
    {
        return $points / 72 * self::MM_PER_INCH;
    }

    public static function millimetresToPoints(float $millimetres): float
    {
        return $millimetres / self::MM_PER_INCH * 72;
    }

    /**
     * ODF hosszusag ("2.5cm", "0.5in", "12pt", "10mm", "3pc") millimeterben;
     * null, ha nem mertekegyseges hossz (pl. szazalek).
     */
    public static function odfLengthToMillimetres(?string $text): ?float
    {
        if ($text === null || preg_match('/^\s*([+-]?\d*\.?\d+)\s*(mm|cm|in|pt|pc|px)\s*$/i', $text, $match) !== 1) {
            return null;
        }

        $value = (float) $match[1];

        return match (strtolower($match[2])) {
            'mm' => $value,
            'cm' => $value * 10,
            'in' => $value * self::MM_PER_INCH,
            'pt' => self::pointsToMillimetres($value),
            'pc' => self::pointsToMillimetres($value * 12),
            default => self::pointsToMillimetres($value * 0.75),
        };
    }

    /** ODF betumeret pontban ("12pt", "0.5cm"); null, ha nem mertekegyseges. */
    public static function odfLengthToPoints(?string $text): ?float
    {
        $millimetres = self::odfLengthToMillimetres($text);

        return $millimetres === null ? null : self::millimetresToPoints($millimetres);
    }
}
