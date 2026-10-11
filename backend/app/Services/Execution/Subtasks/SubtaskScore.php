<?php

declare(strict_types=1);

namespace App\Services\Execution\Subtasks;

/** Egy reszfeladat eredmenye: minden pont vagy semmi. */
final readonly class SubtaskScore
{
    public function __construct(
        public string $label,
        public int $points,
        public int $maxPoints,
        public bool $passed,
        /**
         * "Várt: ..., kapott: ..." a diaknak. Az elvart kimenet egy darabjat
         * tartalmazza, ezert csak akkor van, ha a hibat lathato teszteset
         * okozta; rejtett teszteset eseten mindig null.
         */
        public ?string $note = null,
    ) {}

    /**
     * Egy pontlista a valaszban megjeleno alakban.
     *
     * @param  list<self>  $scores
     * @return list<array{label: string, points: int, max_points: int, passed: bool, note: string|null}>
     */
    public static function listToArray(array $scores): array
    {
        return array_map(static fn (self $score): array => $score->toArray(), $scores);
    }

    /**
     * A futtatas es a beadas valaszaban megjeleno alak.
     *
     * @return array{label: string, points: int, max_points: int, passed: bool, note: string|null}
     */
    public function toArray(): array
    {
        return [...$this->toStoredArray(), 'note' => $this->note];
    }

    /**
     * A `submissions.subtasks` oszlopba kerulo alak: a megjegyzes nelkul, mert
     * az a teszteset elvart kimenetebol idez.
     *
     * @return array{label: string, points: int, max_points: int, passed: bool}
     */
    public function toStoredArray(): array
    {
        return [
            'label' => $this->label,
            'points' => $this->points,
            'max_points' => $this->maxPoints,
            'passed' => $this->passed,
        ];
    }
}
