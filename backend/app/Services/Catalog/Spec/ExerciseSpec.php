<?php

declare(strict_types=1);

namespace App\Services\Catalog\Spec;

use App\Enums\ExerciseKind;

/**
 * A feladat fajtafuggo adatainak (`exercises.spec`) egyetlen belepesi pontja:
 * validacios szabalyok, mentes elotti normalizalas, publikalhatosag es a
 * JSON-ba irhato alak. A fajtankenti reszleteket a KindSpec leszarmazottai
 * tartjak (BACKEND.md 4.1.3).
 *
 * Ismeretlen kulcsot egyik szinten sem fogad el, es az ellenorzesek
 * azonositoit (`checks[].id`) a szerver adja ki (CheckIds).
 */
final class ExerciseSpec
{
    /** A keresben a spec mezoneve; a szabalyok es a hibak kulcsai ezzel kezdodnek. */
    public const FIELD = 'spec';

    /** A teljes spec legfeljebb ekkora lehet JSON-kent. */
    public const MAX_BYTES = 64 * 1024;

    /**
     * A `spec` mezo es a fajtahoz tartozo belso mezok szabalyai. A `null` a
     * spec torleset jelenti, ilyenkor belso szabaly nincs.
     *
     * @param  mixed  $spec  a bekuldott (meg nem ellenorzott) ertek
     * @return array<string, list<mixed>>
     */
    public function rules(ExerciseKind $kind, mixed $spec): array
    {
        $definition = $this->definition($kind);
        $rules = [self::FIELD => ['sometimes', 'nullable', 'array', new KnownKeys($definition->keys())]];

        if (! is_array($spec)) {
            return $rules;
        }

        foreach ($definition->rules(SpecValue::map($spec)) as $path => $pathRules) {
            $rules[self::FIELD.'.'.$path] = $pathRules;
        }

        return $rules;
    }

    /**
     * A szabalyokon tuli hibak (meret, mezok kozotti osszefuggesek). Csak a
     * szabalyokon mar atment adatra hivhato.
     *
     * @return array<string, string> a keres mezoneve (pl. "spec.checks.0.file") => magyar hibauzenet
     */
    public function violations(ExerciseKind $kind, mixed $spec): array
    {
        if (! is_array($spec)) {
            return [];
        }

        $json = json_encode($spec);

        if ($json === false || strlen($json) > self::MAX_BYTES) {
            return [self::FIELD => __('catalog.spec.too_large', ['max' => intdiv(self::MAX_BYTES, 1024)])];
        }

        $violations = [];

        foreach ($this->definition($kind)->violations(SpecValue::map($spec)) as $path => $message) {
            $violations[$path === '' ? self::FIELD : self::FIELD.'.'.$path] = $message;
        }

        return $violations;
    }

    /**
     * A mentendo alak; null, ha a fajtanal nincs mit tarolni (pl. reszfeladat nelkuli kodfeladat).
     *
     * @param  array<array-key, mixed>  $spec  a szabalyokon atment adat
     * @param  array<string, mixed>|null  $previous  a feladat eddig tarolt spec-je, ha a fajtaja nem valtozott
     * @return array<string, mixed>|null
     */
    public function normalise(ExerciseKind $kind, array $spec, ?array $previous = null): ?array
    {
        $normalised = $this->definition($kind)->normalise(SpecValue::map($spec), $previous ?? []);

        return $normalised === [] ? null : $normalised;
    }

    /**
     * Publikalhato-e a feladat ezzel a spec-kel. Kodfeladatnal a spec
     * elhagyhato; minden mas fajtanal kell, es bongeszos fajtanal legalabb egy
     * ellenorzes is.
     *
     * @param  array<string, mixed>|null  $spec
     */
    public function isComplete(ExerciseKind $kind, ?array $spec): bool
    {
        if ($kind->isEditorBased()) {
            return true;
        }

        $definition = $this->definition($kind);

        return $spec !== null && $definition->isComplete($definition->normalise($spec, $spec));
    }

    /**
     * A tarolt spec JSON-ba irhato, teljes alakja (admin nezet); null, ha nincs.
     *
     * @param  array<string, mixed>|null  $spec
     * @return array<string, mixed>|null
     */
    public function export(ExerciseKind $kind, ?array $spec): ?array
    {
        if ($spec === null) {
            return null;
        }

        $exported = $this->definition($kind)->export($spec);

        return $exported === [] ? null : $exported;
    }

    private function definition(ExerciseKind $kind): KindSpec
    {
        return match ($kind) {
            ExerciseKind::Code => new CodeSpec,
            ExerciseKind::Sql => new SqlSpec,
            ExerciseKind::SheetUpload, ExerciseKind::DocUpload, ExerciseKind::VisualUpload => new UploadSpec($kind),
            ExerciseKind::Web => new WebSpec,
            ExerciseKind::SheetBrowser => new SheetBrowserSpec,
            ExerciseKind::DocBrowser => new DocBrowserSpec,
        };
    }
}
