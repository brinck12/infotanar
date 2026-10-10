<?php

declare(strict_types=1);

namespace App\Services\FileTasks;

use App\Enums\RubricState;
use App\Models\Exercise;
use App\Models\RubricItem;
use App\Services\Files\StoredFile;
use Illuminate\Support\Facades\Config;
use Throwable;

/**
 * Egy tarolt fajl ertekelese a feladat ertekelolapja szerint.
 *
 * A kiterjeszteshez tartozo olvaso EGYSZER nyitja meg a fajlt, utana az
 * ertekelolap pontjai sorban futnak le a megnyitott modellen. Kivetelt nem
 * dob: barmi, ami miatt a fajl nem ertelmezheto, `failed` eredmeny lesz
 * (a beadas megtortent, a valasz 201 marad), egy vizsgalat hibaja pedig csak
 * azt az egy pontot teszi "bad"-de.
 *
 * Semmit nem ment es semmit nem tarol: gyakorlo beadasnal a
 * SubmitFileSolution, vizsganal a vizsga ertekeloje, az ertekelolap-probanal
 * a CheckRubric hivja, es a FileEvaluation::applyTo() irja a sorra.
 *
 * Idokorlat: a pontok kozott ellenorizzuk a `filetasks.evaluation_timeout`
 * faliora-korlatot. A set_time_limit() hivas szandekosan NEM itt van, hanem
 * a HTTP-keresnel (SubmitFileSolution): sorkezelo folyamatban a szamlalo
 * atallitasa a teljes workert allitana le.
 */
final readonly class FileEvaluator
{
    public function __construct(private CheckRegistry $registry) {}

    public function evaluate(Exercise $exercise, StoredFile $file): FileEvaluation
    {
        $deadline = microtime(true) + Config::integer('filetasks.evaluation_timeout');
        $reader = $this->registry->readerFor($file->extension);

        if ($reader === null) {
            return FileEvaluation::failed(__('filetasks.no_reader', ['ext' => $file->extension]));
        }

        try {
            $opened = $reader->open($file);
        } catch (UnreadableFile $exception) {
            return FileEvaluation::failed($exception->publicMessage());
        } catch (Throwable $exception) {
            // Az olvaso varatlan hibaja: a diak ugyanazt latja, mint serult fajlnal, mi pedig a naploban a hibat.
            report($exception);

            return FileEvaluation::failed(__('filetasks.unreadable'));
        }

        $items = [];

        foreach ($this->rubric($exercise) as $item) {
            if (microtime(true) > $deadline) {
                return FileEvaluation::failed(__('filetasks.evaluation_timed_out'));
            }

            $items[] = $this->evaluateItem($opened, $item);
        }

        return FileEvaluation::evaluated(new ResultSnapshot($items, $this->facts($opened)));
    }

    /** @return iterable<RubricItem> az ertekelolap pontjai sorrendben */
    private function rubric(Exercise $exercise): iterable
    {
        return $exercise->relationLoaded('rubricItems') ? $exercise->rubricItems : $exercise->rubricItems()->get();
    }

    private function evaluateItem(OpenedFile $opened, RubricItem $item): ResultItem
    {
        if ($item->isManual()) {
            return $this->result($item, RubricState::Manual);
        }

        $handler = $this->registry->handlerFor($item->check_type, $opened);

        if ($handler === null) {
            // Rossz fajlcsalad (pl. tablazatos vizsgalat dokumentumon), vagy a tipusnak meg nincs kezeloje.
            return $this->result($item, RubricState::Bad, __('filetasks.found_not_checkable'));
        }

        try {
            $outcome = $handler->evaluate($opened, $item);
        } catch (Throwable $exception) {
            // Egy vizsgalat hibaja nem donti el a tobbit: ez a pont nem teljesult, a hiba a naploba megy.
            report($exception);

            return $this->result($item, RubricState::Bad);
        }

        return $this->result($item, $outcome->passed ? RubricState::Ok : RubricState::Bad, $outcome->found);
    }

    private function result(RubricItem $item, RubricState $state, ?string $found = null): ResultItem
    {
        return new ResultItem(
            $item->id,
            $item->group === '' ? __('filetasks.group_other') : $item->group,
            $item->label,
            $state,
            $item->points,
            $found,
            $item->hint,
        );
    }

    /** @return list<Fact> */
    private function facts(OpenedFile $opened): array
    {
        try {
            return $opened->facts();
        } catch (Throwable $exception) {
            // A tenyek csak tajekoztatnak: a hianyuk nem teheti sikertelenne az ertekelest.
            report($exception);

            return [];
        }
    }
}
