<?php

declare(strict_types=1);

namespace App\Services\Execution;

use App\Enums\Verdict;

/**
 * Rejtett tesztesetek eredmenyebol csak az allapot mehet ki, adat nem: se
 * bemenet/kimenet/elvart ertek, se hibakimenet (a stderr/compile output
 * visszaadhatja a rejtett bemenetet), se futasi reszlet (ido, kilepesi kod,
 * a Judge0 nyers allapotszovege).
 *
 * Feketelista helyett fehérlista: egy kesobb hozzaadott mezo alapbol NEM
 * kerul ki. A kulcsok (time, exit_code, judge_status) megmaradnak semleges
 * ertekkel, hogy a kliensek szerzodese ne valtozzon.
 */
final class HiddenResultRedactor
{
    private const ALLOWED = ['test_case_id', 'hidden', 'passed', 'verdict', 'verdict_label'];

    /**
     * @param  list<array<string, mixed>>  $results
     * @return list<array<string, mixed>>
     */
    public function redact(array $results): array
    {
        return array_map(static function (array $result): array {
            // Hianyzo jeloles eseten is rejtettkent kezeljuk: a biztonsagos alapertek.
            if (($result['hidden'] ?? true) === false) {
                return $result;
            }

            $safe = array_intersect_key($result, array_flip(self::ALLOWED));

            // A rendszerhiba uzenete (pl. "nem elerheto") nem a tesztesetrol szol, maradhat.
            if (($result['verdict'] ?? null) === Verdict::SystemError->value && isset($result['error'])) {
                $safe['error'] = $result['error'];
            }

            return $safe + [
                'time' => null,
                'exit_code' => null,
                'judge_status' => $safe['verdict_label'] ?? null,
            ];
        }, $results);
    }
}
