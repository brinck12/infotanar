<?php

declare(strict_types=1);

namespace App\Services\Execution\Comparison;

/**
 * Soronkenti osszevetes: a sorvegi szokozok es a zaro ures sorok nem
 * szamitanak. Beallitas nelkul ez pontosan az osszevetesi modok elotti
 * viselkedes, ezert a meglevo feladatok eredmenye nem valtozik.
 */
final class ExactComparator implements OutputComparator
{
    public function compare(string $actual, string $expected, ComparisonSettings $settings): ComparisonResult
    {
        // Elteres-leirast nem adunk: a diak a ket kimenetet egymas mellett latja.
        return OutputText::lines($actual, $settings) === OutputText::lines($expected, $settings)
            ? ComparisonResult::match()
            : ComparisonResult::mismatch();
    }
}
