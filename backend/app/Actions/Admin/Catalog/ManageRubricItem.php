<?php

declare(strict_types=1);

namespace App\Actions\Admin\Catalog;

use App\Actions\Audit\RecordAuditEvent;
use App\Enums\AuditAction;
use App\Enums\RubricMode;
use App\Exceptions\Catalog\InvalidOrder;
use App\Exceptions\FileTasks\UnknownRubricCheck;
use App\Models\Exercise;
use App\Models\RubricItem;
use App\Models\User;
use App\Services\Catalog\SiblingOrder;
use App\Services\FileTasks\RubricCheckCatalog;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

/**
 * Egy fajlfeladat ertekelolapjanak szerkesztese.
 *
 * - A sorrend (`position`) mindig 0..n-1 (SiblingOrder).
 * - A `manual` tipusu pont mindig kezi, barmit kuld is az urlap.
 * - Automatikus pont csak akkor mentheto, ha a tipus kezeloje vegre tudja
 *   hajtani a `property` / `expected` part (RubricCheckCatalog): igy minden
 *   elmentett automatikus pont kiertekelheto.
 * - A korabbi beadasok eredmenye pillanatkep, ezert a szerkesztes es a torles
 *   mindig megengedett, es a regi eredmenyeket nem irja at.
 */
final readonly class ManageRubricItem
{
    public function __construct(
        private SiblingOrder $order,
        private RubricCheckCatalog $catalog,
        private RecordAuditEvent $audit,
    ) {}

    /**
     * Uj pont a lap vegere.
     *
     * @param  array<string, mixed>  $attributes
     *
     * @throws UnknownRubricCheck
     */
    public function create(Exercise $exercise, array $attributes, User $actor): RubricItem
    {
        return DB::transaction(function () use ($exercise, $attributes, $actor): RubricItem {
            $item = new RubricItem($attributes);
            $item->exercise_id = $exercise->id;
            $item->position = $this->order->next($this->siblings($exercise->id));
            $this->assertExecutable($item);
            $item->save();

            $this->audit->handle(AuditAction::CatalogCreated, $actor, $item);

            return $item;
        });
    }

    /**
     * @param  array<string, mixed>  $attributes
     *
     * @throws UnknownRubricCheck
     */
    public function update(RubricItem $item, array $attributes, User $actor): RubricItem
    {
        return DB::transaction(function () use ($item, $attributes, $actor): RubricItem {
            $item->fill($attributes);
            $this->assertExecutable($item);
            $changes = array_keys($item->getDirty());
            $item->save();

            $this->audit->handle(AuditAction::CatalogUpdated, $actor, $item, ['fields' => $changes]);

            return $item;
        });
    }

    public function delete(RubricItem $item, User $actor): void
    {
        DB::transaction(function () use ($item, $actor): void {
            $exerciseId = $item->exercise_id;

            $this->audit->handle(AuditAction::CatalogDeleted, $actor, $item, ['attributes' => $item->attributesToArray()]);
            $item->delete();

            $this->order->compact($this->siblings($exerciseId));
        });
    }

    /**
     * @param  list<int>  $orderedIds  a feladat osszes pontja, pontosan egyszer
     *
     * @throws InvalidOrder
     */
    public function reorder(Exercise $exercise, array $orderedIds, User $actor): void
    {
        DB::transaction(function () use ($exercise, $orderedIds, $actor): void {
            $this->order->reorder($this->siblings($exercise->id), $orderedIds);

            $this->audit->handle(AuditAction::CatalogReordered, $actor, $exercise, ['rubric_item_order' => $orderedIds]);
        });
    }

    /**
     * A mezok kozotti szabalyok a (reszlegesen) kitoltott ponton, mentes elott.
     *
     * @throws UnknownRubricCheck ha az automatikus pont nem hajthato vegre
     */
    private function assertExecutable(RubricItem $item): void
    {
        if ($item->check_type->isManual()) {
            $item->mode = RubricMode::Manual;
        }

        if ($item->isManual()) {
            return;
        }

        $error = $this->catalog->validate($item->check_type, $item->property, $item->expected);

        if ($error !== null) {
            throw new UnknownRubricCheck($error);
        }
    }

    /** @return Builder<RubricItem> */
    private function siblings(int $exerciseId): Builder
    {
        return RubricItem::query()->where('exercise_id', $exerciseId);
    }
}
