<?php

declare(strict_types=1);

namespace App\Services\Catalog\Spec;

use Illuminate\Validation\Rule;

/**
 * Bongeszos tablazatos gyakorlo (`sheet_browser`): a racs merete, a kiindulo
 * cellak es az ellenorzolista (a frontend `SheetPracticeInfo` tipusa; a
 * kiertekeles: frontend/src/features/practice/sheet/checks.ts).
 *
 *   { "columns": 6, "rows": 12, "cells": { "A1": "Szakasz", "B2": "30" },
 *     "checks": [{ "id": 1, "label": "A C2 cellában képlet áll", "type": "has_formula", "cell": "C2" }] }
 */
final class SheetBrowserSpec extends KindSpec
{
    private const CELL = '[A-Z]{1,2}[1-9][0-9]{0,2}';

    private CheckVariants $checks;

    public function __construct()
    {
        $cell = CheckField::text(5, '/^'.self::CELL.'$/');

        $this->checks = new CheckVariants(['id', 'label', 'type'], [
            'has_formula' => ['cell' => $cell],
            // Magyar, ekezetes fuggvenynevek is (pl. SZUM, DARABTELI).
            'uses_function' => ['cell' => $cell, 'function' => CheckField::text(24, '/^[A-ZÁÉÍÓÖŐÚÜŰ.]{2,24}$/u')],
            'references' => ['cell' => $cell, 'reference' => CheckField::text(11, '/^'.self::CELL.'(:'.self::CELL.')?$/')],
            'value' => ['cell' => $cell, 'expected' => CheckField::text(200)],
            'filled_down' => ['range' => CheckField::text(11, '/^'.self::CELL.':'.self::CELL.'$/')],
        ]);
    }

    public function keys(): array
    {
        return ['columns', 'rows', 'cells', 'checks'];
    }

    public function rules(array $spec): array
    {
        return [
            'columns' => ['required', 'integer', 'between:1,26'],
            'rows' => ['required', 'integer', 'between:1,100'],
            'cells' => ['sometimes', 'array'],
            // Az ures cella (null) egyszeruen kimarad.
            'cells.*' => ['nullable', 'string', 'max:200'],
            'checks' => ['sometimes', 'array', 'list', 'max:30'],
            'checks.*.id' => ['sometimes', 'nullable', 'integer', 'min:1', 'distinct'],
            'checks.*.label' => ['required', 'string', 'max:200'],
            'checks.*.type' => ['required', 'string', Rule::in($this->checks->types())],
            ...$this->checks->rules('checks', $spec['checks'] ?? null),
        ];
    }

    public function violations(array $spec): array
    {
        $columns = SpecValue::integer($spec['columns'] ?? null);
        $rows = SpecValue::integer($spec['rows'] ?? null);
        $violations = [];

        foreach (array_keys(SpecValue::map($spec['cells'] ?? null)) as $address) {
            // A PHP a csupa szamjegy kulcsot egessze alakitja; a cim itt mindig szoveg.
            $address = (string) $address;

            if (preg_match('/^'.self::CELL.'$/', $address) !== 1) {
                $violations['cells'] = __('catalog.spec.cell_invalid', ['cell' => $address]);
            } elseif (! $this->inGrid($address, $columns, $rows)) {
                $violations['cells'] = __('catalog.spec.cell_outside', ['cell' => $address, 'columns' => $columns, 'rows' => $rows]);
            }
        }

        foreach (SpecValue::items($spec['checks'] ?? null) as $index => $check) {
            $check = SpecValue::map($check);

            foreach (['cell', 'reference', 'range'] as $field) {
                foreach (explode(':', SpecValue::string($check[$field] ?? null)) as $address) {
                    if ($address !== '' && ! $this->inGrid($address, $columns, $rows)) {
                        $violations["checks.{$index}.{$field}"] = __('catalog.spec.cell_outside', ['cell' => $address, 'columns' => $columns, 'rows' => $rows]);
                    }
                }
            }

            if (($check['type'] ?? null) === 'filled_down' && ! $this->runsDown(SpecValue::string($check['range'] ?? null))) {
                $violations["checks.{$index}.range"] ??= __('catalog.spec.range_not_column');
            }
        }

        return $violations;
    }

    public function normalise(array $spec, array $previous = []): array
    {
        $checks = SpecValue::items($spec['checks'] ?? null);
        $ids = CheckIds::assign($checks, $previous['checks'] ?? null);

        return [
            'columns' => SpecValue::integer($spec['columns'] ?? null),
            'rows' => SpecValue::integer($spec['rows'] ?? null),
            'cells' => array_filter(
                SpecValue::map($spec['cells'] ?? null),
                static fn (mixed $content): bool => is_string($content) && $content !== '',
            ),
            'checks' => array_map(fn (mixed $check, int $id): array => [
                'id' => $id,
                'label' => SpecValue::string(SpecValue::map($check)['label'] ?? null),
                ...$this->checks->values($check),
            ], $checks, $ids),
        ];
    }

    public function isComplete(array $spec): bool
    {
        return SpecValue::items($spec['checks'] ?? null) !== [];
    }

    /** Ures racsnal a `cells` ures objektum legyen a JSON-ban, ne ures tomb. */
    public function export(array $spec): array
    {
        $exported = parent::export($spec);

        return [...$exported, 'cells' => (object) $exported['cells']];
    }

    /** A cellacim (pl. "C12") a racson belul van-e; a racs legfeljebb 26 oszlopos, ezert csak egybetus oszlop fer bele. */
    private function inGrid(string $address, int $columns, int $rows): bool
    {
        if (preg_match('/^([A-Z])([1-9][0-9]{0,2})$/', $address, $parts) !== 1) {
            return false;
        }

        return ord($parts[1]) - ord('A') < $columns && (int) $parts[2] <= $rows;
    }

    /** A tartomany egyetlen oszlopban, felulrol lefele halad-e (pl. "C2:C10"): a kitoltes lefele tortenik. */
    private function runsDown(string $range): bool
    {
        if (preg_match('/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/', $range, $parts) !== 1) {
            return false;
        }

        return $parts[1] === $parts[3] && (int) $parts[2] < (int) $parts[4];
    }
}
