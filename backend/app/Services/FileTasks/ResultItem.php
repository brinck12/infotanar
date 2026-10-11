<?php

declare(strict_types=1);

namespace App\Services\FileTasks;

use App\Enums\RubricState;

/**
 * Az ertekelolap egy pontjanak eredmenye egy beadasban
 * (`file_submissions.result.items[]`).
 *
 * A pontszam nem tarolt adat, hanem az allapotbol kovetkezik: automatikus
 * pontnal mindent vagy semmit, kezi pontnal a diak jelolese donti el. Az
 * allapot kezi pontnal a jeloles utan is `manual` marad (a felulet a
 * `manual_mark`-bol rajzol).
 */
final readonly class ResultItem
{
    public function __construct(
        public int $rubricItemId,
        public string $group,
        public string $label,
        public RubricState $state,
        public int $maxPoints,
        /** Amit a vizsgalat a fajlban talalt; null, ha nem volt mit vizsgalni (es kezi pontnal). */
        public ?string $found = null,
        /** Mit javitson a diak; a felulet csak nem teljesult pontnal mutatja. */
        public ?string $hint = null,
        /** Kezi pontnal a diak dontese; null, amig nem dontott. Automatikus pontnal mindig null. */
        public ?bool $manualMark = null,
    ) {}

    public function isManual(): bool
    {
        return $this->state === RubricState::Manual;
    }

    public function points(): int
    {
        return match ($this->state) {
            RubricState::Ok => $this->maxPoints,
            RubricState::Bad => 0,
            RubricState::Manual => $this->manualMark === true ? $this->maxPoints : 0,
        };
    }

    /** Ugyanez a pont a diak (uj) jelolesevel. Csak kezi ponton van ertelme. */
    public function withMark(bool $mark): self
    {
        return new self($this->rubricItemId, $this->group, $this->label, $this->state, $this->maxPoints, $this->found, $this->hint, $mark);
    }

    /**
     * A tarolt es az API-ban kiadott alak.
     *
     * @return array{rubric_item_id: int, group: string, label: string, state: string, points: int, max_points: int, found: string|null, hint: string|null, manual_mark: bool|null}
     */
    public function toArray(): array
    {
        return [
            'rubric_item_id' => $this->rubricItemId,
            'group' => $this->group,
            'label' => $this->label,
            'state' => $this->state->value,
            'points' => $this->points(),
            'max_points' => $this->maxPoints,
            'found' => $this->found,
            'hint' => $this->hint,
            'manual_mark' => $this->manualMark,
        ];
    }

    /**
     * Visszaolvasas a tarolt pillanatkepbol. A JSON-t nem tekintjuk
     * megbizhato alakunak: ami hianyzik vagy rossz tipusu, az a legszigorubb
     * ertelmezest kapja (ismeretlen allapot = nem teljesult).
     *
     * @param  array<array-key, mixed>  $data
     */
    public static function fromArray(array $data): self
    {
        $state = is_string($data['state'] ?? null) ? RubricState::tryFrom($data['state']) : null;
        $state ??= RubricState::Bad;
        $mark = $data['manual_mark'] ?? null;

        return new self(
            self::integer($data['rubric_item_id'] ?? null),
            is_string($data['group'] ?? null) ? $data['group'] : '',
            is_string($data['label'] ?? null) ? $data['label'] : '',
            $state,
            max(0, self::integer($data['max_points'] ?? null)),
            is_string($data['found'] ?? null) ? $data['found'] : null,
            is_string($data['hint'] ?? null) ? $data['hint'] : null,
            $state === RubricState::Manual && is_bool($mark) ? $mark : null,
        );
    }

    private static function integer(mixed $value): int
    {
        return is_int($value) || (is_string($value) && ctype_digit($value)) ? (int) $value : 0;
    }
}
