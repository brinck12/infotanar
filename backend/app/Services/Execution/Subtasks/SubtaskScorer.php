<?php

declare(strict_types=1);

namespace App\Services\Execution\Subtasks;

use App\Services\Execution\Comparison\ComparisonSettings;
use App\Services\Execution\Comparison\OutputComparators;
use Illuminate\Support\Str;

/**
 * Reszfeladatonkenti pontozas (emelt szintu programozas).
 *
 * A kimenetet es a teszteset elvart kimenetet az "N. feladat" fejlecek menten
 * szakaszokra bontjuk (SubtaskSections). Egy reszfeladat egy tesztesetnel
 * akkor jo, ha mindket kimenetben van ilyen szakasz, es a ketto a feladat
 * osszevetesi beallitasa szerint egyezik. Pontot csak az a reszfeladat er,
 * amelyik minden lefutott tesztesetnel jo: minden pont vagy semmi.
 */
final readonly class SubtaskScorer
{
    /** A megjegyzesben a vart es a kapott szovegbol legfeljebb ennyi karakter latszik. */
    private const NOTE_LENGTH = 80;

    public function __construct(private OutputComparators $comparators) {}

    /**
     * @param  non-empty-list<SubtaskDefinition>  $subtasks
     * @param  list<TestCaseOutput>  $outputs  a lefutott tesztesetek; ha egy sem futott le, senki nem kap pontot
     * @return non-empty-list<SubtaskScore>
     */
    public function score(array $subtasks, array $outputs, ComparisonSettings $settings): array
    {
        $sections = array_map(static fn (TestCaseOutput $output): array => [
            'hidden' => $output->hidden,
            'actual' => SubtaskSections::split($output->actual),
            'expected' => SubtaskSections::split($output->expected),
        ], $outputs);

        return array_map(function (SubtaskDefinition $subtask) use ($sections, $settings): SubtaskScore {
            $note = null;
            $passed = $sections !== [];
            $failedOnHidden = false;

            foreach ($sections as $testCase) {
                $actual = $testCase['actual'][$subtask->number] ?? null;
                $expected = $testCase['expected'][$subtask->number] ?? null;

                if ($actual !== null && $expected !== null && $this->comparators->compare($actual, $expected, $settings)->matches) {
                    continue;
                }

                $passed = false;
                $failedOnHidden = $failedOnHidden || $testCase['hidden'];
                // Az elso hibas lathato teszteset a mervado: a diak ezt tudja eloszor javitani.
                $note ??= $testCase['hidden'] ? null : $this->note($subtask, $actual, $expected);
            }

            return new SubtaskScore(
                $subtask->label,
                $passed ? $subtask->points : 0,
                $subtask->points,
                $passed,
                // Ha rejtett teszteset is hibas, a megjegyzes felrevezeto lenne: a lathato javitasa nem eleg.
                $failedOnHidden ? null : $note,
            );
        }, $subtasks);
    }

    /**
     * A megoldas nem futott ertekelhetoen (forditasi vagy rendszerhiba):
     * minden reszfeladat 0 pont, megjegyzes nelkul.
     *
     * @param  non-empty-list<SubtaskDefinition>  $subtasks
     * @return non-empty-list<SubtaskScore>
     */
    public function unscored(array $subtasks): array
    {
        return array_map(
            static fn (SubtaskDefinition $subtask): SubtaskScore => new SubtaskScore($subtask->label, 0, $subtask->points, false),
            $subtasks,
        );
    }

    private function note(SubtaskDefinition $subtask, ?string $actual, ?string $expected): string
    {
        if ($actual === null) {
            return __('execution.subtasks.missing_section', ['number' => $subtask->number]);
        }

        return __('execution.subtasks.note', [
            'expected' => $this->excerpt($expected ?? ''),
            'actual' => $this->excerpt($actual),
        ]);
    }

    /** Egysoros, rovid kivonat: a sortoresek es a tobbszoros szokozok egy szokozze valnak. */
    private function excerpt(string $section): string
    {
        // Bajtonkenti minta (nem /u): a nem UTF-8 kimeneten sem all meg.
        $text = trim((string) preg_replace('/\s+/', ' ', $section));

        return $text === '' ? __('execution.subtasks.empty') : Str::limit($text, self::NOTE_LENGTH, '…');
    }
}
