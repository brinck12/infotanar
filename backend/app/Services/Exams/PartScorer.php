<?php

declare(strict_types=1);

namespace App\Services\Exams;

use App\Enums\FileSubmissionStatus;
use App\Models\FileSubmission;
use App\Models\Submission;
use App\Services\Execution\Subtasks\SubtaskDefinition;
use App\Services\FileTasks\ResultItem;
use App\Services\FileTasks\ResultSnapshot;

/**
 * A vizsgareszek pontozasa: a nyers pontbol (ertekelolap vagy kodbeadas)
 * vizsgapont lesz, mindig lefele kerekitve (hivatalos atvaltas, FRONTEND.md 9.),
 * es a diaknak szolo egy soros osszegzes.
 *
 * Tiszta szamitas: adatbazishoz nem nyul, az ertekelest nem futtatja.
 */
final class PartScorer
{
    /** Nyers pont atvaltasa vizsgapontra: floor(raw * points / rawMax). */
    public function convert(int $raw, int $rawMax, int $points): int
    {
        if ($rawMax <= 0 || $points <= 0) {
            return 0;
        }

        return intdiv(max(0, min($raw, $rawMax)) * $points, $rawMax);
    }

    /**
     * Fajlos resz pontja a probalkozas feltoltott fajljabol.
     *
     * @param  int  $points  a resz pontja a vizsgan
     */
    public function filePart(int $partId, int $order, int $points, ?FileSubmission $row): PartScore
    {
        if ($row === null) {
            return new PartScore($partId, $order, 0, $points, 0, $points, __('exams.summary.no_file'), null, null);
        }

        if ($row->status !== FileSubmissionStatus::Evaluated) {
            // Feldolgozhatatlan (vagy meg nem ertekelt) fajl: nulla pont, az ok a diaknak szolo magyar szoveg.
            return new PartScore($partId, $order, 0, $points, 0, $points, $row->error ?? __('filetasks.unreadable'), $row->id, null);
        }

        // Ures ertekelolap (0 pont osszesen): a resz pontja a nevezo, a nyers pont ugyis 0.
        $rawMax = $row->max_score > 0 ? $row->max_score : $points;
        $snapshot = ResultSnapshot::fromArray($row->result);

        return new PartScore(
            $partId,
            $order,
            $this->convert($row->score, $rawMax, $points),
            $points,
            $row->score,
            $rawMax,
            $this->fileSummary($snapshot),
            $row->id,
            null,
            $this->pendingPoints($snapshot, $points, $rawMax),
        );
    }

    /**
     * Szerkesztos resz pontja a legjobb ervenyes beadasbol.
     *
     * @param  int  $points  a resz pontja a vizsgan
     * @param  array<string, mixed>|null  $spec  a feladat `spec`-je (a reszfeladatok sorszamaihoz)
     */
    public function editorPart(int $partId, int $order, int $points, ?Submission $best, ?array $spec): PartScore
    {
        if ($best === null) {
            return new PartScore($partId, $order, 0, $points, 0, 0, __('exams.summary.no_solution'), null, null);
        }

        [$raw, $rawMax] = $this->rawOf($best);

        return new PartScore(
            $partId,
            $order,
            $this->convert($raw, $rawMax, $points),
            $points,
            $raw,
            $rawMax,
            $this->editorSummary($best, $raw, $rawMax, $spec),
            null,
            $best->id,
        );
    }

    /**
     * A beadas nyers pontja es maximuma: a tarolt pont, regi soron a
     * teljesult / osszes teszteset.
     *
     * @return array{0: int, 1: int}
     */
    public function rawOf(Submission $submission): array
    {
        if ($submission->score !== null && $submission->max_score !== null) {
            return [$submission->score, $submission->max_score];
        }

        $results = $submission->results ?? [];
        $passed = count(array_filter($results, static fn (array $result): bool => ($result['passed'] ?? false) === true));

        return [$passed, count($results)];
    }

    /**
     * A legjobb arany (nyers / maximum) beadas; egyenlo aranynal a kesobbi.
     *
     * @param  iterable<Submission>  $submissions
     */
    public function bestOf(iterable $submissions): ?Submission
    {
        $best = null;
        $bestRaw = 0;
        $bestMax = 0;

        foreach ($submissions as $submission) {
            [$raw, $max] = $this->rawOf($submission);

            if ($best === null) {
                $better = true;
            } else {
                // raw/max >= bestRaw/bestMax kereszbe szorozva; nulla maximumnal az arany nulla.
                $left = $raw * max($bestMax, 1);
                $right = $bestRaw * max($max, 1);
                $better = $left > $right || ($left === $right && $submission->id > $best->id);
            }

            if ($better) {
                $best = $submission;
                $bestRaw = $raw;
                $bestMax = $max;
            }
        }

        return $best;
    }

    /** "A legtobb pont itt veszett el: Formazas (3 pont)." A fuggo kezi pontok nem szamitanak vesztesegnek. */
    private function fileSummary(ResultSnapshot $snapshot): ?string
    {
        /** @var array<string, int> $lost */
        $lost = [];

        foreach ($snapshot->items as $item) {
            if ($item->isManual() && $item->manualMark === null) {
                continue;
            }

            $lost[$item->group] = ($lost[$item->group] ?? 0) + ($item->maxPoints - $item->points());
        }

        arsort($lost);
        $group = array_key_first($lost);

        if ($group === null || $lost[$group] <= 0) {
            return null;
        }

        return __('exams.summary.lost_group', ['group' => (string) $group, 'lost' => $lost[$group]]);
    }

    /** A meg nem jelolt kezi pontokbol szerezheto vizsgapont. */
    private function pendingPoints(ResultSnapshot $snapshot, int $points, int $rawMax): int
    {
        return array_sum(array_map(
            static fn (ResultItem $item): int => $item->isManual() && $item->manualMark === null
                ? intdiv($item->maxPoints * $points, max(1, $rawMax))
                : 0,
            $snapshot->items,
        ));
    }

    /**
     * @param  array<string, mixed>|null  $spec
     */
    private function editorSummary(Submission $submission, int $raw, int $rawMax, ?array $spec): ?string
    {
        $subtasks = $submission->subtasks ?? [];

        if ($subtasks !== []) {
            $definitions = SubtaskDefinition::listFrom($spec);

            foreach (array_values($subtasks) as $index => $subtask) {
                if ($subtask['passed']) {
                    continue;
                }

                return __('exams.summary.subtask_failed', [
                    'number' => isset($definitions[$index]) ? $definitions[$index]->number : $index + 1,
                    'label' => $subtask['label'],
                ]);
            }

            return null;
        }

        // Reszfeladat nelkul csak darabszamot mondunk: a tesztesetek tartalma (a rejtetteke) nem szivároghat ki.
        $failed = $rawMax - $raw;

        return $failed > 0 ? __('exams.summary.tests_failed', ['failed' => $failed, 'total' => $rawMax]) : null;
    }
}
