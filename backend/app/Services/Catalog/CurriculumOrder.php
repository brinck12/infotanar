<?php

declare(strict_types=1);

namespace App\Services\Catalog;

use App\Models\Lesson;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

/**
 * A tanulasi sorrend egy kepzesi agon belul: modul pozicio, azon belul lecke
 * pozicio (azonos pozicional az azonosito dont). Az admin atrendezese utan
 * minden "elozo / kovetkezo" ebbol szamolodik, hogy mindenhol ugyanaz legyen.
 */
final class CurriculumOrder
{
    /**
     * Az ag publikalt leckei tanulasi sorrendben, a tartalmuk nelkul.
     *
     * @return Collection<int, Lesson>
     */
    public function lessons(int $trackId): Collection
    {
        return Lesson::query()
            ->join('modules', 'modules.id', '=', 'lessons.module_id')
            ->where('modules.track_id', $trackId)
            ->where('lessons.is_published', true)
            ->orderBy('modules.position')
            ->orderBy('modules.id')
            ->orderBy('lessons.position')
            ->orderBy('lessons.id')
            ->get(['lessons.id', 'lessons.module_id', 'lessons.slug', 'lessons.title', 'lessons.is_free']);
    }

    /**
     * Egy elem szomszedai a sorrendben; ha az elem nincs benne, egyik sincs.
     *
     * @template TModel of Model
     *
     * @param  \Illuminate\Support\Collection<int, TModel>  $sequence
     * @return array{previous: TModel|null, next: TModel|null}
     */
    public function neighbours(\Illuminate\Support\Collection $sequence, int $id): array
    {
        $items = $sequence->values();
        $index = $items->search(static fn (Model $item): bool => $item->getKey() === $id);

        if (! is_int($index)) {
            return ['previous' => null, 'next' => null];
        }

        return ['previous' => $items->get($index - 1), 'next' => $items->get($index + 1)];
    }
}
