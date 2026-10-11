<?php

declare(strict_types=1);

namespace App\Services\FileTasks\Spreadsheet;

/**
 * Egy munkalap: a kitoltott cellak, az oszlopok es sorok merete, a
 * nyomtatasi terulet es a felteteles formazasok. Csak olvashato.
 *
 * Mertekegysegek: oszlopszelesseg milliméterben, sormagassag pontban. Az xlsx
 * az oszlopszelesseget "karakterben" tarolja; az atvaltas az alap betutipusra
 * (7 keppont szeles szamjegy, 96 dpi) vonatkozik, ezert kozelito.
 */
final readonly class Sheet
{
    private const DIGIT_WIDTH_PIXELS = 7;

    private const COLUMN_PADDING_PIXELS = 5;

    private const MILLIMETRES_PER_PIXEL = 25.4 / 96;

    /** @var array<int, array<int, Cell>> sor => oszlop => cella, novekvo sorrendben */
    private array $rows;

    /** A kitoltott cellakat befoglalo tartomany; null, ha a lap ures. */
    public ?CellRange $usedRange;

    public int $formulaCount;

    /**
     * @param  array<int, array<int, Cell>>  $rows  sor => oszlop => cella
     * @param  list<AxisSpan>  $columns  oszlopsavok (szelesseg mm-ben)
     * @param  list<AxisSpan>  $rowSpans  sorsavok (magassag pontban)
     * @param  list<CellRange>  $printAreas
     * @param  list<ConditionalFormat>  $conditionalFormats
     */
    public function __construct(
        public string $name,
        array $rows,
        private float $defaultColumnWidth,
        private float $defaultRowHeight,
        private array $columns = [],
        private array $rowSpans = [],
        public array $printAreas = [],
        public array $conditionalFormats = [],
    ) {
        ksort($rows);

        $formulas = 0;
        $firstColumn = PHP_INT_MAX;
        $lastColumn = 0;

        foreach ($rows as $row => $cells) {
            ksort($cells);
            $rows[$row] = $cells;

            foreach ($cells as $column => $cell) {
                $formulas += $cell->hasFormula() ? 1 : 0;
                $firstColumn = min($firstColumn, $column);
                $lastColumn = max($lastColumn, $column);
            }
        }

        $rows = array_filter($rows, static fn (array $cells): bool => $cells !== []);

        $this->rows = $rows;
        $this->formulaCount = $formulas;
        $this->usedRange = $rows === []
            ? null
            : new CellRange($firstColumn, (int) array_key_first($rows), $lastColumn, (int) array_key_last($rows));
    }

    /** Az Excel feluleten latszo, karakterben mert oszlopszelesseg (pl. 8,43) milliméterben. */
    public static function charactersToMillimetres(float $characters): float
    {
        return ($characters * self::DIGIT_WIDTH_PIXELS + self::COLUMN_PADDING_PIXELS) * self::MILLIMETRES_PER_PIXEL;
    }

    /**
     * Az xlsx `<col width>` erteke milliméterben. A fajl a feluleten latszo
     * erteknel nagyobbat tarol, mert a cella belso margoja is benne van
     * (ECMA-376 18.3.1.13): a keppontban mert szelesseg a tarolt ertek hetszerese.
     */
    public static function storedWidthToMillimetres(float $stored): float
    {
        return round($stored * self::DIGIT_WIDTH_PIXELS) * self::MILLIMETRES_PER_PIXEL;
    }

    public static function millimetresToCharacters(float $millimetres): float
    {
        return max(0.0, ($millimetres / self::MILLIMETRES_PER_PIXEL - self::COLUMN_PADDING_PIXELS) / self::DIGIT_WIDTH_PIXELS);
    }

    public function cell(int $column, int $row): ?Cell
    {
        return $this->rows[$row][$column] ?? null;
    }

    /**
     * A tartomany kitoltott cellai sorfolytonosan: [oszlop, sor, cella].
     *
     * @return list<array{0: int, 1: int, 2: Cell}>
     */
    public function cellsIn(CellRange $range): array
    {
        $found = [];

        foreach ($this->rows as $row => $cells) {
            if ($row < $range->firstRow || $row > $range->lastRow) {
                continue;
            }

            foreach ($cells as $column => $cell) {
                if ($column >= $range->firstColumn && $column <= $range->lastColumn) {
                    $found[] = [$column, $row, $cell];
                }
            }
        }

        return $found;
    }

    /** Az oszlop szelessege milliméterben; ha a fajl nem adja meg, a lap alapszelessege. */
    public function columnWidth(int $column): float
    {
        return $this->spanFor($this->columns, $column)->size ?? $this->defaultColumnWidth;
    }

    public function columnHidden(int $column): bool
    {
        return $this->spanFor($this->columns, $column)->hidden ?? false;
    }

    /** A sor magassaga pontban; ha a fajl nem adja meg, a lap alapmagassaga. */
    public function rowHeight(int $row): float
    {
        return $this->spanFor($this->rowSpans, $row)->size ?? $this->defaultRowHeight;
    }

    /** @param list<AxisSpan> $spans */
    private function spanFor(array $spans, int $index): ?AxisSpan
    {
        foreach ($spans as $span) {
            if ($span->covers($index)) {
                return $span;
            }
        }

        return null;
    }
}
