<?php

declare(strict_types=1);

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Magyar adoszam: `xxxxxxxx-y-zz`.
 *
 * - Az elso 8 jegy a torzsszam; a 8. jegy ellenorzo szam: az elso het jegy
 *   9-7-3-1-9-7-3 sulyokkal vett osszegebol (10 - osszeg mod 10) mod 10.
 * - `y` az AFA-kod (1-5).
 * - `zz` a teruleti kod (02-20, 22, 41, 42, 44, 51).
 *
 * Kotojelek nelkul (11 jegy) is elfogadja; a normalizalast a FormRequest vegzi.
 */
final class HungarianTaxNumber implements ValidationRule
{
    private const WEIGHTS = [9, 7, 3, 1, 9, 7, 3];

    private const AREA_CODES = [
        '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20',
        '22', '41', '42', '44', '51',
    ];

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_string($value) || ! self::isValid($value)) {
            $fail(__('billing.validation.tax_number'));
        }
    }

    public static function isValid(string $value): bool
    {
        if (preg_match('/^(\d{8})-?([1-5])-?(\d{2})$/', $value, $m) !== 1) {
            return false;
        }

        [, $core, , $area] = $m;

        $sum = 0;
        foreach (self::WEIGHTS as $i => $weight) {
            $sum += (int) $core[$i] * $weight;
        }

        return (10 - $sum % 10) % 10 === (int) $core[7] && in_array($area, self::AREA_CODES, true);
    }

    /** `12345678-1-12` alakra hoz egy mar ervenyes adoszamot. */
    public static function normalize(string $value): string
    {
        $digits = preg_replace('/\D/', '', $value) ?? '';

        return substr($digits, 0, 8).'-'.substr($digits, 8, 1).'-'.substr($digits, 9, 2);
    }
}
