<?php

declare(strict_types=1);

namespace App\Services\Execution\Comparison;

use Closure;
use Illuminate\Support\Str;

/**
 * Ket elemsorozat osszevetese: ugyanannyi elem, es paronkent egyeznek. Azt,
 * hogy ket elem mikor egyezik, a hivo mondja meg (szovegkent vagy szamkent).
 */
final class TokenSequence
{
    /** Az elteres leirasaban egy elembol legfeljebb ennyi karakter latszik. */
    private const SHOWN_LENGTH = 40;

    /**
     * @param  list<string>  $actual
     * @param  list<string>  $expected
     * @param  Closure(string, string): bool  $same  a kapott es az elvart elem egyezik-e
     */
    public static function compare(array $actual, array $expected, Closure $same): ComparisonResult
    {
        foreach ($expected as $index => $expectedToken) {
            $actualToken = $actual[$index] ?? null;

            // Elfogyott a kapott kimenet: a darabszam-elteres alabb pontosabban leirja.
            if ($actualToken === null) {
                break;
            }

            if (! $same($actualToken, $expectedToken)) {
                return ComparisonResult::mismatch(__('execution.comparison.token_differs', [
                    'position' => $index + 1,
                    'actual' => Str::limit($actualToken, self::SHOWN_LENGTH, '…'),
                    'expected' => Str::limit($expectedToken, self::SHOWN_LENGTH, '…'),
                ]));
            }
        }

        if (count($actual) !== count($expected)) {
            return ComparisonResult::mismatch(__('execution.comparison.token_count', [
                'actual' => count($actual),
                'expected' => count($expected),
            ]));
        }

        return ComparisonResult::match();
    }
}
