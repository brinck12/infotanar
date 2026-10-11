<?php

declare(strict_types=1);

namespace App\Services\FileTasks\Spreadsheet;

use App\Services\FileTasks\Fact;
use App\Services\FileTasks\Grammar\Text;
use App\Services\FileTasks\OpenedFile;

/**
 * Egy megnyitott munkafuzet (xlsx vagy ods), formatumtol fuggetlenul. A
 * tablazatos vizsgalatok ezen dolgoznak; csak olvashato.
 */
final readonly class SpreadsheetModel implements OpenedFile
{
    /** A tenyek kozott legfeljebb ennyi munkalap szerepel nev szerint. */
    private const FACT_SHEET_LIMIT = 8;

    /**
     * @param  list<Sheet>  $sheets  a munkafuzet sorrendjeben; legalabb egy
     * @param  list<Chart>  $charts
     */
    public function __construct(
        public array $sheets,
        public array $charts = [],
    ) {}

    /**
     * A megnevezett munkalap (a kis- es nagybetu es az ekezet nem szamit);
     * nev nelkul az elso munkalap. Null, ha nincs ilyen.
     */
    public function sheet(?string $name): ?Sheet
    {
        if ($name === null) {
            return $this->sheets[0] ?? null;
        }

        foreach ($this->sheets as $sheet) {
            if (Text::equals($sheet->name, $name)) {
                return $sheet;
            }
        }

        return null;
    }

    /**
     * A megadott munkalap diagramjai; nev nelkul a munkafuzet osszes diagramja.
     *
     * @return list<Chart>
     */
    public function chartsOn(?string $sheet): array
    {
        if ($sheet === null) {
            return $this->charts;
        }

        return array_values(array_filter(
            $this->charts,
            static fn (Chart $chart): bool => Text::equals($chart->sheet, $sheet),
        ));
    }

    public function facts(): array
    {
        $listed = array_slice($this->sheets, 0, self::FACT_SHEET_LIMIT);
        $more = count($this->sheets) > count($listed) ? '…' : '';

        $names = array_map(static fn (Sheet $sheet): string => $sheet->name, $listed);
        $ranges = array_map(
            static fn (Sheet $sheet): string => $sheet->name.': '.($sheet->usedRange?->label() ?? __('filetasks.fact_sheet_empty')),
            $listed,
        );
        $formulas = array_sum(array_map(static fn (Sheet $sheet): int => $sheet->formulaCount, $this->sheets));

        return [
            new Fact(__('filetasks.fact_sheets'), implode(', ', $names).$more),
            new Fact(__('filetasks.fact_used_range'), implode('; ', $ranges).$more),
            new Fact(__('filetasks.fact_formulas'), (string) $formulas),
            new Fact(__('filetasks.fact_charts'), $this->chartSummary()),
        ];
    }

    private function chartSummary(): string
    {
        if ($this->charts === []) {
            return '0';
        }

        $types = array_unique(array_map(
            static fn (Chart $chart): string => __('filetasks.chart_type_'.$chart->type),
            $this->charts,
        ));

        return count($this->charts).' ('.implode(', ', $types).')';
    }
}
