<?php

declare(strict_types=1);

namespace App\Actions\Admin\Catalog;

use App\Actions\Audit\RecordAuditEvent;
use App\Enums\AuditAction;
use App\Models\User;
use App\Services\Catalog\SiblingOrder;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

/**
 * Egyseges letrehozas / modositas / torles / atrendezes a negy
 * katalogus-szintre (track, modul, lecke, feladat). Mind pozicioval
 * rendezett egy szulon belul; csak a szulo-kulcs neve ter el
 * (track: nincs, modul: track_id, lecke: module_id, feladat: lesson_id).
 *
 * Minden valtozas naplozott (audit_logs), a pozicio-invarianst (0..n-1)
 * a SiblingOrder tartja fenn.
 */
final readonly class ManageCatalogItem
{
    public function __construct(
        private SiblingOrder $order,
        private RecordAuditEvent $audit,
    ) {}

    /**
     * Uj elem a szulo vegere.
     *
     * @template TModel of Model
     *
     * @param  TModel  $item
     * @return TModel
     */
    public function create(Model $item, ?string $parentKey, User $actor): Model
    {
        return DB::transaction(function () use ($item, $parentKey, $actor): Model {
            $item->setAttribute('position', $this->order->next($this->siblings($item, $parentKey)));
            $item->save();

            $this->audit->handle(AuditAction::CatalogCreated, $actor, $item);

            return $item;
        });
    }

    /**
     * Modositas; ha a szulo valtozik (athelyezes), az uj szulo vegere kerul,
     * a regi szulo testverei pedig ujraszamozodnak.
     *
     * @template TModel of Model
     *
     * @param  TModel  $item
     * @param  array<string, mixed>  $attributes
     * @return TModel
     */
    public function update(Model $item, array $attributes, ?string $parentKey, User $actor): Model
    {
        return DB::transaction(function () use ($item, $attributes, $parentKey, $actor): Model {
            $item->fill($attributes);

            $moved = $parentKey !== null && $item->isDirty($parentKey);
            $oldSiblings = $moved ? $this->siblingsOf($item, $parentKey, $item->getOriginal($parentKey)) : null;

            if ($moved) {
                $item->setAttribute('position', $this->order->next($this->siblings($item, $parentKey)));
            }

            $changes = array_keys($item->getDirty());
            $item->save();

            if ($oldSiblings !== null) {
                $this->order->compact($oldSiblings);
            }

            $this->audit->handle(AuditAction::CatalogUpdated, $actor, $item, ['fields' => $changes]);

            return $item;
        });
    }

    public function delete(Model $item, ?string $parentKey, User $actor): void
    {
        DB::transaction(function () use ($item, $parentKey, $actor): void {
            $siblings = $this->siblings($item, $parentKey);
            $this->audit->handle(AuditAction::CatalogDeleted, $actor, $item, ['attributes' => $item->attributesToArray()]);
            $item->delete();
            $this->order->compact($siblings);
        });
    }

    /**
     * @param  Builder<covariant Model>  $siblings
     * @param  list<int>  $orderedIds
     */
    public function reorder(Builder $siblings, array $orderedIds, ?Model $parent, User $actor): void
    {
        DB::transaction(function () use ($siblings, $orderedIds, $parent, $actor): void {
            $this->order->reorder($siblings, $orderedIds);
            $this->audit->handle(AuditAction::CatalogReordered, $actor, $parent, ['order' => $orderedIds]);
        });
    }

    /** @return Builder<Model> */
    private function siblings(Model $item, ?string $parentKey): Builder
    {
        return $parentKey === null
            ? $item->newQuery()
            : $this->siblingsOf($item, $parentKey, $item->getAttribute($parentKey));
    }

    /** @return Builder<Model> */
    private function siblingsOf(Model $item, string $parentKey, mixed $parentId): Builder
    {
        return $item->newQuery()->where($parentKey, $parentId);
    }
}
