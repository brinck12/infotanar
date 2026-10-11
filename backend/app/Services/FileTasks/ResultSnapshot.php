<?php

declare(strict_types=1);

namespace App\Services\FileTasks;

use Illuminate\Support\Facades\Config;

/**
 * Egy beadas eredmenyenek pillanatkepe (`file_submissions.result`): a pontok,
 * a beloluk szamolt csoportok es osszpontszam, es amit az olvaso a fajlban
 * talalt.
 *
 * Ez az egyetlen hely, amely a pontokbol csoportot, osszpontszamot es
 * megoldottsagot szamol: az ertekelo (FileEvaluator), a kezi jeloles
 * (SaveManualMarks) es a vizsgaeredmeny is ebbol dolgozik, igy nem terhetnek el.
 */
final readonly class ResultSnapshot
{
    /**
     * @param  list<ResultItem>  $items  az ertekelolap sorrendjeben
     * @param  list<Fact>  $facts
     */
    public function __construct(
        public array $items,
        public array $facts = [],
    ) {}

    /**
     * Visszaolvasas a tarolt JSON-bol; null vagy hibas alak ures pillanatkep.
     *
     * @param  array<array-key, mixed>|null  $data
     */
    public static function fromArray(?array $data): self
    {
        $items = [];
        $facts = [];

        foreach (self::rows($data['items'] ?? null) as $row) {
            $items[] = ResultItem::fromArray($row);
        }

        foreach (self::rows($data['facts'] ?? null) as $row) {
            if (is_string($row['label'] ?? null) && is_string($row['value'] ?? null)) {
                $facts[] = new Fact($row['label'], $row['value']);
            }
        }

        return new self($items, $facts);
    }

    /** Van-e ilyen azonositoju KEZI pont az eredmenyben. */
    public function hasManualItem(int $rubricItemId): bool
    {
        foreach ($this->items as $item) {
            if ($item->rubricItemId === $rubricItemId && $item->isManual()) {
                return true;
            }
        }

        return false;
    }

    /**
     * Ugyanez a pillanatkep a diak jeloleseivel. A meg nem nevezett kezi
     * pontok jelolese valtozatlan; nem kezi pontra a jelolesnek nincs hatasa.
     *
     * @param  array<int, bool>  $marks  ertekelolap-pont azonositoja => megvan-e
     */
    public function withMarks(array $marks): self
    {
        return new self(
            array_map(
                static fn (ResultItem $item): ResultItem => $item->isManual() && array_key_exists($item->rubricItemId, $marks)
                    ? $item->withMark($marks[$item->rubricItemId])
                    : $item,
                $this->items,
            ),
            $this->facts,
        );
    }

    /** A megszerzett pont: automatikus pontok es a megjelolt kezi pontok. */
    public function score(): int
    {
        return array_sum(array_map(static fn (ResultItem $item): int => $item->points(), $this->items));
    }

    /** Az ertekelolap osszpontszama, a kezi pontokkal egyutt. */
    public function maxScore(): int
    {
        return array_sum(array_map(static fn (ResultItem $item): int => $item->maxPoints, $this->items));
    }

    /** Megoldottnak szamit-e: a pontszam eleri az osszpontszam `filetasks.pass_ratio` reszet (felfele kerekitve). */
    public function passed(): bool
    {
        $max = $this->maxScore();

        return $max > 0 && $this->score() >= (int) ceil($max * Config::float('filetasks.pass_ratio'));
    }

    /** A meg el nem dontott kezi pontokbol szerezheto pont (a vizsgaeredmeny `pending_manual_points`-jahoz). */
    public function pendingManualPoints(): int
    {
        return array_sum(array_map(
            static fn (ResultItem $item): int => $item->isManual() && $item->manualMark === null ? $item->maxPoints : 0,
            $this->items,
        ));
    }

    /**
     * A csoportok az elso elofordulasuk sorrendjeben, a pontjaik osszegevel.
     *
     * @return list<array{name: string, score: int, max_score: int}>
     */
    public function groups(): array
    {
        $groups = [];

        foreach ($this->items as $item) {
            $groups[$item->group] ??= ['name' => $item->group, 'score' => 0, 'max_score' => 0];
            $groups[$item->group]['score'] += $item->points();
            $groups[$item->group]['max_score'] += $item->maxPoints;
        }

        return array_values($groups);
    }

    /**
     * A tarolt alak (`file_submissions.result`), amely egyben az API valasz
     * `groups`, `items` es `facts` mezoje.
     *
     * @return array{groups: list<array{name: string, score: int, max_score: int}>, items: list<array<string, mixed>>, facts: list<array{label: string, value: string}>}
     */
    public function toArray(): array
    {
        return [
            'groups' => $this->groups(),
            'items' => array_map(static fn (ResultItem $item): array => $item->toArray(), $this->items),
            'facts' => array_map(static fn (Fact $fact): array => $fact->toArray(), $this->facts),
        ];
    }

    /**
     * @return list<array<array-key, mixed>>
     */
    private static function rows(mixed $value): array
    {
        return is_array($value) ? array_values(array_filter($value, is_array(...))) : [];
    }
}
