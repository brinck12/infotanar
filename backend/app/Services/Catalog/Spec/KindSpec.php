<?php

declare(strict_types=1);

namespace App\Services\Catalog\Spec;

/**
 * Egy feladatfajta `spec` JSON-janak leirasa: mit fogad el, es milyen alakra
 * hozza mentes elott. Az alakokat a BACKEND.md 4.1.3 rogziti, a diaknak
 * kimeno resz pedig a frontend tipusait koveti (frontend/src/types/index.ts).
 *
 * A peldanyokat az ExerciseSpec valasztja ki a fajta alapjan; kivulrol azon
 * at erdemes hasznalni.
 */
abstract class KindSpec
{
    /**
     * A `spec` megengedett legfelso szintu kulcsai.
     *
     * @return list<string>
     */
    abstract public function keys(): array;

    /**
     * Validacios szabalyok; a kulcsok a `spec`-en beluli utvonalak (pl. "checks.*.label").
     *
     * @param  array<string, mixed>  $spec  a bekuldott adat (a tipusfuggo mezok szabalyai ebbol keszulnek)
     * @return array<string, list<mixed>>
     */
    abstract public function rules(array $spec): array;

    /**
     * A szabalyokkal ki nem fejezheto, mezok kozotti hibak. Csak akkor fut, ha
     * a szabalyok mar teljesultek.
     *
     * @param  array<string, mixed>  $spec
     * @return array<string, string> utvonal a `spec`-en belul ("" = maga a spec) => magyar hibauzenet
     */
    public function violations(array $spec): array
    {
        return [];
    }

    /**
     * A mentendo alak: csak az ismert kulcsok, vegleges tipusokkal, a hianyzo
     * elhagyhato mezok alaperteken, az ellenorzesek azonositoval.
     *
     * @param  array<string, mixed>  $spec
     * @param  array<string, mixed>  $previous  a feladat eddig tarolt spec-je (az ellenorzesek azonositoihoz)
     * @return array<string, mixed> ures, ha nincs mit tarolni
     */
    abstract public function normalise(array $spec, array $previous = []): array;

    /**
     * Publikalhato-e ezzel a tartalommal a feladat (pl. van-e legalabb egy ellenorzes).
     *
     * @param  array<string, mixed>  $spec  normalizalt alak
     */
    public function isComplete(array $spec): bool
    {
        return true;
    }

    /**
     * A JSON-ba irhato alak. A tarolt adatot ujra normalizalja, igy a kezzel
     * (seeder, import) bevitt, hianyos spec is teljes alakban megy ki.
     *
     * @param  array<string, mixed>  $spec
     * @return array<string, mixed>
     */
    public function export(array $spec): array
    {
        return $this->normalise($spec, $spec);
    }
}
