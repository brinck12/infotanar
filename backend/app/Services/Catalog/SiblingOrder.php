<?php

declare(strict_types=1);

namespace App\Services\Catalog;

use App\Exceptions\Catalog\InvalidOrder;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

/**
 * Rendezett testverek sorszam-oszlopanak kezelese egy szulon belul (katalogus:
 * `position`, tesztesetek: `order`). Invarians: a sorszamok mindig 0..n-1,
 * hezag es ismetlodes nelkul.
 */
final class SiblingOrder
{
    /** @param Builder<covariant Model> $siblings */
    public function next(Builder $siblings): int
    {
        return $siblings->count();
    }

    /**
     * Torles / athelyezes utan: a megmaradt testverek 0-tol, folytonosan.
     *
     * @param  Builder<covariant Model>  $siblings
     */
    public function compact(Builder $siblings, string $column = 'position'): void
    {
        $ids = (clone $siblings)->orderBy($column)->orderBy('id')->pluck('id')->values()->all();
        $this->write($siblings, $ids, $column);
    }

    /**
     * Uj sorrend: a kliens a szulo OSSZES gyerekenek azonositojat kuldi,
     * pontosan egyszer. Reszleges vagy idegen lista hibas (422), igy a
     * sorrend nem sérülhet.
     *
     * @param  Builder<covariant Model>  $siblings
     * @param  list<int>  $orderedIds
     *
     * @throws InvalidOrder
     */
    public function reorder(Builder $siblings, array $orderedIds, string $column = 'position'): void
    {
        $current = (clone $siblings)->pluck('id')->map(static fn (mixed $id): int => is_numeric($id) ? (int) $id : 0)->sort()->values()->all();
        $requested = $orderedIds;
        sort($requested);

        if ($current !== $requested) {
            throw new InvalidOrder;
        }

        $this->write($siblings, $orderedIds, $column);
    }

    /**
     * @param  Builder<covariant Model>  $siblings
     * @param  array<int, mixed>  $orderedIds
     */
    private function write(Builder $siblings, array $orderedIds, string $column): void
    {
        DB::transaction(static function () use ($siblings, $orderedIds, $column): void {
            foreach (array_values($orderedIds) as $index => $id) {
                (clone $siblings)->whereKey($id)->update([$column => $index]);
            }
        });
    }
}
