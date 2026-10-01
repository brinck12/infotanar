<?php

declare(strict_types=1);

namespace App\Services\Execution\Comparison;

/**
 * Soronkenti osszevetes: a sorvegi szokozokat es a zaro ures sorokat
 * normalizaljuk, mert ezek erettsegi-feladatoknal nem relevans elteresek.
 * Ez a #155 elotti viselkedes, ezert a meglevo feladatok nem valtoznak.
 */
final class ExactComparator implements OutputComparator
{
    public function compare(string $actual, string $expected, ComparisonSettings $settings): Comparison
    {
        $same = OutputText::lines($actual, $settings->caseInsensitive, $settings->ignoreBlankLines)
            === OutputText::lines($expected, $settings->caseInsensitive, $settings->ignoreBlankLines);

        // A pontos modban a diak a ket kimenetet egymas mellett latja, ezert nincs kulon leiras.
        return $same ? Comparison::match() : Comparison::mismatch();
    }
}
