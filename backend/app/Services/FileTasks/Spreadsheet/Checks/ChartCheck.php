<?php

declare(strict_types=1);

namespace App\Services\FileTasks\Spreadsheet\Checks;

use App\Enums\RubricCheckType;
use App\Services\FileTasks\CheckOutcome;
use App\Services\FileTasks\Grammar\Booleans;
use App\Services\FileTasks\Grammar\Numbers;
use App\Services\FileTasks\Grammar\PropertyKey;
use App\Services\FileTasks\Grammar\Text;
use App\Services\FileTasks\Spreadsheet\Chart;
use App\Services\FileTasks\Spreadsheet\SpreadsheetModel;

/**
 * Diagram vizsgalata. A tulajdonsag: type, title, x_title, y_title,
 * series_count, has_labels, has_legend, opcionalisan `[sheet=Munkalap]`.
 * Akkor teljesul, ha a munkafuzet (vagy a megadott lap) valamelyik diagramja megfelel.
 *
 * A cimek szovege: pontos egyezes, `~reszlet` tartalmazas, `*` barmilyen nem ures cim.
 * A `series_count`: egesz szam vagy `>=N`.
 */
final class ChartCheck extends SpreadsheetCheck
{
    private const KEYS = ['type', 'title', 'x_title', 'y_title', 'series_count', 'has_labels', 'has_legend'];

    /** A szerzo altal irt tipusnev (magyarul is) => a modell tipusa. */
    private const TYPES = [
        'column' => Chart::COLUMN, 'oszlop' => Chart::COLUMN, 'oszlopdiagram' => Chart::COLUMN,
        'bar' => Chart::BAR, 'sav' => Chart::BAR, 'savdiagram' => Chart::BAR,
        'line' => Chart::LINE, 'vonal' => Chart::LINE, 'vonaldiagram' => Chart::LINE,
        'scatter' => Chart::SCATTER, 'xy' => Chart::SCATTER, 'pont' => Chart::SCATTER, 'pontdiagram' => Chart::SCATTER,
        'pie' => Chart::PIE, 'kor' => Chart::PIE, 'kordiagram' => Chart::PIE,
        'area' => Chart::AREA, 'teruletdiagram' => Chart::AREA, 'terulet' => Chart::AREA,
        'doughnut' => Chart::DOUGHNUT, 'gyuru' => Chart::DOUGHNUT,
        'radar' => Chart::RADAR,
        'bubble' => Chart::BUBBLE, 'buborek' => Chart::BUBBLE,
    ];

    public function type(): RubricCheckType
    {
        return RubricCheckType::Chart;
    }

    public function validate(string $property, string $expected): ?string
    {
        $key = PropertyKey::parse($property);

        if ($key === null || ! in_array($key->key, self::KEYS, true)) {
            return self::message('filetasks.chart_property_invalid', ['list' => implode(', ', self::KEYS)]);
        }

        if ($key->selector !== null && $key->selectorValue('sheet') === null) {
            return self::message('filetasks.chart_selector_invalid');
        }

        $expected = trim($expected);

        return match ($key->key) {
            'type' => $this->chartType($expected) === null ? self::message('filetasks.chart_type_invalid', ['list' => 'column, bar, line, scatter, pie']) : null,
            'series_count' => $this->seriesExpectation($expected) === null ? self::message('filetasks.chart_series_invalid') : null,
            'has_labels', 'has_legend' => Booleans::parse($expected) === null ? self::message('filetasks.boolean_expected_invalid') : null,
            default => $expected === '' ? self::message('filetasks.sheet_expected_required') : null,
        };
    }

    protected function check(SpreadsheetModel $model, string $property, string $expected): CheckOutcome
    {
        $key = PropertyKey::parse($property);

        if ($key === null) {
            return CheckOutcome::fail();
        }

        $charts = $model->chartsOn($key->selectorValue('sheet'));

        if ($charts === []) {
            return CheckOutcome::fail();
        }

        $expected = trim($expected);
        $found = null;

        foreach ($charts as $chart) {
            [$passed, $shown] = $this->compare($chart, $key->key, $expected);
            $found ??= $shown;

            if ($passed) {
                return CheckOutcome::pass($shown);
            }
        }

        return CheckOutcome::fail($found);
    }

    /** @return array{0: bool, 1: string|null} [teljesul-e, amit a diagramon talaltunk] */
    private function compare(Chart $chart, string $key, string $expected): array
    {
        switch ($key) {
            case 'type':
                return [$chart->type === $this->chartType($expected), self::message('filetasks.chart_type_'.$chart->type)];

            case 'series_count':
                $rule = $this->seriesExpectation($expected);
                $count = $chart->seriesCount;

                return [$rule !== null && ($rule[0] ? $count >= $rule[1] : $count === $rule[1]), (string) $count];

            case 'has_labels':
                return [Booleans::parse($expected) === $chart->hasLabels, self::message($chart->hasLabels ? 'filetasks.chart_has' : 'filetasks.chart_has_not')];

            case 'has_legend':
                return [Booleans::parse($expected) === $chart->hasLegend, self::message($chart->hasLegend ? 'filetasks.chart_has' : 'filetasks.chart_has_not')];

            default:
                $text = match ($key) {
                    'title' => $chart->title,
                    'x_title' => $chart->xTitle,
                    default => $chart->yTitle,
                };

                if ($text === null || $text === '') {
                    return [false, null];
                }

                return [$expected === '*' || Text::matches($text, $expected), $text];
        }
    }

    private function chartType(string $expected): ?string
    {
        return self::TYPES[Text::fold($expected)] ?? null;
    }

    /** @return array{0: bool, 1: int}|null [legalabb-e, darabszam] */
    private function seriesExpectation(string $expected): ?array
    {
        $atLeast = str_starts_with($expected, '>=');
        $count = Numbers::parseCount($atLeast ? substr($expected, 2) : $expected);

        return $count === null ? null : [$atLeast, $count];
    }
}
