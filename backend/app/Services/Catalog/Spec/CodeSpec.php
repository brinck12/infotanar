<?php

declare(strict_types=1);

namespace App\Services\Catalog\Spec;

/**
 * Programozasi feladat (`code`): a szamozott reszfeladatok es a pontjaik.
 * Reszfeladat nelkul nincs mit tarolni, ilyenkor a `spec` ures marad.
 *
 *   { "subtasks": [{ "number": 1, "label": "Darabszám", "points": 2 }] }
 */
final class CodeSpec extends KindSpec
{
    public function keys(): array
    {
        return ['subtasks'];
    }

    public function rules(array $spec): array
    {
        return [
            'subtasks' => ['sometimes', 'array', 'list', 'max:30'],
            'subtasks.*' => ['array', new KnownKeys(['number', 'label', 'points'])],
            // A sorszam az, amit a program a kimenetben kiir ("3. feladat").
            'subtasks.*.number' => ['required', 'integer', 'between:1,30', 'distinct'],
            'subtasks.*.label' => ['required', 'string', 'max:200'],
            'subtasks.*.points' => ['required', 'integer', 'between:1,50'],
        ];
    }

    public function normalise(array $spec, array $previous = []): array
    {
        $subtasks = array_map(static function (mixed $subtask): array {
            $subtask = SpecValue::map($subtask);

            return [
                'number' => SpecValue::integer($subtask['number'] ?? null),
                'label' => SpecValue::string($subtask['label'] ?? null),
                'points' => SpecValue::integer($subtask['points'] ?? null),
            ];
        }, SpecValue::items($spec['subtasks'] ?? null));

        usort($subtasks, static fn (array $a, array $b): int => $a['number'] <=> $b['number']);

        return $subtasks === [] ? [] : ['subtasks' => $subtasks];
    }
}
