<?php

declare(strict_types=1);

namespace App\Services\FileTasks\Spreadsheet\Checks;

use App\Enums\RubricCheckType;
use App\Services\FileTasks\CheckOutcome;
use App\Services\FileTasks\Spreadsheet\Cell;
use App\Services\FileTasks\Spreadsheet\CellRange;
use App\Services\FileTasks\Spreadsheet\FormulaNormalizer;
use App\Services\FileTasks\Spreadsheet\Sheet;
use App\Services\FileTasks\Spreadsheet\SpreadsheetModel;

/**
 * A cella (vagy tartomany) kepletenek vizsgalata. Az elvart ertek vesszovel
 * elvalasztott, ES-sel kapcsolt feltetelek:
 *   any        van keplet
 *   fn:SZUM    a keplet hasznalja a fuggvenyt (magyar es angol nev egyarant)
 *   ref:$A$1   a keplet hivatkozik erre a cimre (abszolut/relativ jeloles szamit)
 *   copied     a tartomany keplete ugyanaz (masolt keplet, R1C1 alakban)
 *   nofixed    nincs beleirt szam a kepletben (a 0 es az 1 kivetelevel)
 */
final class CellFormulaCheck extends SpreadsheetCheck
{
    public function type(): RubricCheckType
    {
        return RubricCheckType::CellFormula;
    }

    public function validate(string $property, string $expected): ?string
    {
        if (($error = $this->addressError($property)) !== null) {
            return $error;
        }

        foreach ($this->terms($expected) as $term) {
            if ($this->parseTerm($term) === null) {
                return self::message('filetasks.formula_term_invalid', ['term' => $term]);
            }
        }

        return $this->terms($expected) === [] ? self::message('filetasks.sheet_expected_required') : null;
    }

    protected function check(SpreadsheetModel $model, string $property, string $expected): CheckOutcome
    {
        $located = $this->locate($model, $property);

        if ($located === null) {
            return CheckOutcome::fail();
        }

        [$sheet, $range] = $located;

        $cells = [];

        foreach ($this->positions($range) as [$column, $row]) {
            $cells[] = [$column, $row, $sheet->cell($column, $row)];
        }

        $first = $cells[0] ?? null;
        $found = $first !== null && $first[2] instanceof Cell && $first[2]->formula !== null
            ? '='.FormulaNormalizer::localized($first[2]->formula)
            : null;

        // Minden cellanak kepletesnek kell lennie, kulonben nincs mit vizsgalni.
        $formulas = [];

        foreach ($cells as [$column, $row, $cell]) {
            if (! $cell instanceof Cell || $cell->formula === null) {
                return CheckOutcome::fail($found ?? $this->describeConstant($sheet, $range));
            }

            $formulas[] = [$column, $row, $cell->formula];
        }

        foreach ($this->terms($expected) as $term) {
            $parsed = $this->parseTerm($term);

            if ($parsed === null || ! $this->satisfies($parsed, $formulas)) {
                return CheckOutcome::fail($found);
            }
        }

        return CheckOutcome::pass($found);
    }

    /** @return list<string> */
    private function terms(string $expected): array
    {
        return array_values(array_filter(array_map(trim(...), explode(',', $expected)), static fn (string $term): bool => $term !== ''));
    }

    /** @return array{0: string, 1: string}|null [fajta, argumentum] */
    private function parseTerm(string $term): ?array
    {
        $lower = mb_strtolower($term, 'UTF-8');

        if (in_array($lower, ['any', 'copied', 'nofixed'], true)) {
            return [$lower, ''];
        }

        if (preg_match('/^(fn|ref)\s*:\s*(\S+)$/iu', $term, $match) !== 1) {
            return null;
        }

        $kind = strtolower($match[1]);

        if ($kind === 'fn') {
            return preg_match('/^[\p{L}][\p{L}0-9_.]*$/u', $match[2]) === 1 ? ['fn', FormulaNormalizer::english($match[2])] : null;
        }

        return preg_match('/^(?:(?:\'[^\']+\'|[\p{L}0-9_.]+)!)?\$?[A-Za-z]{1,3}\$?[0-9]{1,7}(?::\$?[A-Za-z]{1,3}\$?[0-9]{1,7})?$/u', $match[2]) === 1
            ? ['ref', FormulaNormalizer::normalizeReference($match[2])]
            : null;
    }

    /**
     * @param  array{0: string, 1: string}  $term
     * @param  list<array{0: int, 1: int, 2: string}>  $formulas  [oszlop, sor, kanonikus keplet]
     */
    private function satisfies(array $term, array $formulas): bool
    {
        [$kind, $argument] = $term;

        switch ($kind) {
            case 'any':
                return true;

            case 'fn':
                foreach ($formulas as [, , $formula]) {
                    if (! in_array($argument, FormulaNormalizer::functions($formula), true)) {
                        return false;
                    }
                }

                return true;

            case 'ref':
                foreach ($formulas as [, , $formula]) {
                    if (! in_array($argument, array_map(FormulaNormalizer::normalizeReference(...), FormulaNormalizer::references($formula)), true)) {
                        return false;
                    }
                }

                return true;

            case 'nofixed':
                foreach ($formulas as [, , $formula]) {
                    if (FormulaNormalizer::hasFixedNumbers($formula)) {
                        return false;
                    }
                }

                return true;

            default: // copied
                $shapes = array_unique(array_map(
                    static fn (array $entry): string => FormulaNormalizer::relativeTo($entry[2], $entry[0], $entry[1]),
                    $formulas,
                ));

                return count($shapes) <= 1;
        }
    }

    /** A tartomany elso cellajanak allando erteke, ha nincs keplet (a diak megertse, mit talaltunk). */
    private function describeConstant(Sheet $sheet, CellRange $range): ?string
    {
        $cell = $sheet->cell($range->firstColumn, $range->firstRow);

        return $cell === null || ! $cell->hasValue() ? null : self::message('filetasks.found_constant', ['value' => $cell->display()]);
    }
}
