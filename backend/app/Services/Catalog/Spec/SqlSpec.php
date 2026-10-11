<?php

declare(strict_types=1);

namespace App\Services\Catalog\Spec;

/**
 * SQL feladat (`sql`): az adatbazis szerkezete es a mentendo lekerdezesek.
 * Tajekoztato adat a semapanelhez (a frontend `SqlTaskInfo` tipusa); az
 * ertekeles tovabbra is a teszteseteken fut.
 *
 *   { "database": "konyvtar",
 *     "tables": [{ "name": "konyv", "columns": [{ "name": "id", "primary": true, "references": null }] }],
 *     "subtasks": [{ "label": "A 2000 utáni könyvek", "query_name": "2uj", "points": 2 }] }
 */
final class SqlSpec extends KindSpec
{
    public function keys(): array
    {
        return ['database', 'tables', 'subtasks'];
    }

    public function rules(array $spec): array
    {
        return [
            'database' => ['required', 'string', 'max:60'],
            'tables' => ['required', 'array', 'list', 'min:1', 'max:30'],
            'tables.*' => ['array', new KnownKeys(['name', 'columns'])],
            'tables.*.name' => ['required', 'string', 'max:60'],
            'tables.*.columns' => ['required', 'array', 'list', 'min:1', 'max:60'],
            'tables.*.columns.*' => ['array', new KnownKeys(['name', 'primary', 'references'])],
            'tables.*.columns.*.name' => ['required', 'string', 'max:60'],
            'tables.*.columns.*.primary' => ['sometimes', 'boolean'],
            // Idegen kulcs celja, pl. "szerzo.id".
            'tables.*.columns.*.references' => ['sometimes', 'nullable', 'string', 'max:120'],
            'subtasks' => ['sometimes', 'array', 'list', 'max:30'],
            'subtasks.*' => ['array', new KnownKeys(['label', 'query_name', 'points'])],
            'subtasks.*.label' => ['required', 'string', 'max:200'],
            'subtasks.*.query_name' => ['required', 'string', 'regex:/^[A-Za-z0-9_]{1,40}$/'],
            'subtasks.*.points' => ['required', 'integer', 'between:1,50'],
        ];
    }

    public function normalise(array $spec, array $previous = []): array
    {
        return [
            'database' => SpecValue::string($spec['database'] ?? null),
            'tables' => array_map(static function (mixed $table): array {
                $table = SpecValue::map($table);

                return [
                    'name' => SpecValue::string($table['name'] ?? null),
                    'columns' => array_map(static function (mixed $column): array {
                        $column = SpecValue::map($column);

                        return [
                            'name' => SpecValue::string($column['name'] ?? null),
                            'primary' => SpecValue::boolean($column['primary'] ?? null),
                            'references' => SpecValue::nullableString($column['references'] ?? null),
                        ];
                    }, SpecValue::items($table['columns'] ?? null)),
                ];
            }, SpecValue::items($spec['tables'] ?? null)),
            'subtasks' => array_map(static function (mixed $subtask): array {
                $subtask = SpecValue::map($subtask);

                return [
                    'label' => SpecValue::string($subtask['label'] ?? null),
                    'query_name' => SpecValue::string($subtask['query_name'] ?? null),
                    'points' => SpecValue::integer($subtask['points'] ?? null),
                ];
            }, SpecValue::items($spec['subtasks'] ?? null)),
        ];
    }
}
