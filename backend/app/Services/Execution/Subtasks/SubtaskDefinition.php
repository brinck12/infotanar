<?php

declare(strict_types=1);

namespace App\Services\Execution\Subtasks;

/**
 * Egy pontozott reszfeladat a feladat `spec.subtasks` listajabol:
 *
 *     { "number": 2, "label": "Összeg", "points": 3 }
 *
 * A `number` az a sorszam, amellyel a program a kimenetben a reszt jeloli
 * ("2. feladat").
 */
final readonly class SubtaskDefinition
{
    public function __construct(
        public int $number,
        public string $label,
        public int $points,
    ) {}

    /**
     * A feladat pontozott reszfeladatai a megadott sorrendben; ures, ha nincs.
     *
     * A `spec` alakjat az admin FormRequest ellenorzi. Itt a hibas vagy ismetelt
     * sorszamu elem egyszeruen kimarad, hogy egy rossz adat miatt ne alljon meg
     * a kiertekeles.
     *
     * @param  array<string, mixed>|null  $spec  az `exercises.spec` oszlop
     * @return list<self>
     */
    public static function listFrom(?array $spec): array
    {
        $entries = $spec['subtasks'] ?? null;
        if (! is_array($entries)) {
            return [];
        }

        $subtasks = [];
        foreach ($entries as $entry) {
            if (! is_array($entry) || ! is_int($entry['number'] ?? null) || ! is_int($entry['points'] ?? null)) {
                continue;
            }

            $number = $entry['number'];
            if ($number < 1 || $entry['points'] < 0 || isset($subtasks[$number])) {
                continue;
            }

            $label = is_string($entry['label'] ?? null) ? trim($entry['label']) : '';

            $subtasks[$number] = new self(
                $number,
                $label !== '' ? $label : __('execution.subtasks.default_label', ['number' => $number]),
                $entry['points'],
            );
        }

        return array_values($subtasks);
    }
}
