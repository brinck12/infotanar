<?php

declare(strict_types=1);

namespace App\Services\Catalog\Spec;

/**
 * A bongeszos ellenorzesek azonositoit a szerver adja ki. A bongeszo az
 * allapotot (melyik pont teljesult) az azonositohoz koti, ezert:
 *  - a bekuldott azonosito megmarad;
 *  - uj ellenorzes olyan szamot kap, amely sem a kuldott, sem a korabban
 *    mentett ellenorzesek kozott nem szerepelt, igy egy torolt pont azonositoja
 *    nem szall at egy masikra.
 * Ures feladatnal a szamozas 1-tol indul.
 */
final class CheckIds
{
    /**
     * @param  list<mixed>  $checks  a mentendo ellenorzesek
     * @param  mixed  $previous  a feladat eddig tarolt ellenorzesei
     * @return list<int> az ellenorzesek azonositoi, a `$checks` sorrendjeben
     */
    public static function assign(array $checks, mixed $previous): array
    {
        $sent = array_map(self::idOf(...), $checks);
        $stored = array_map(self::idOf(...), SpecValue::items($previous));
        // Tombkent adjuk at: azonosito nelkul a max() egyetlen szamot kapna, es hibat dobna.
        $next = max([0, ...array_filter($sent), ...array_filter($stored)]) + 1;

        return array_map(static function (?int $id) use (&$next): int {
            return $id ?? $next++;
        }, $sent);
    }

    private static function idOf(mixed $check): ?int
    {
        $id = SpecValue::nullableInteger(SpecValue::map($check)['id'] ?? null);

        return $id !== null && $id > 0 ? $id : null;
    }
}
