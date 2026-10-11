<?php

declare(strict_types=1);

namespace App\Services\FileTasks\Spreadsheet\Checks;

use App\Enums\RubricCheckType;
use App\Services\FileTasks\CheckOutcome;
use App\Services\FileTasks\Grammar\Text;
use App\Services\FileTasks\Spreadsheet\Cell;
use App\Services\FileTasks\Spreadsheet\CellRange;
use App\Services\FileTasks\Spreadsheet\CellReference;
use App\Services\FileTasks\Spreadsheet\CellType;
use App\Services\FileTasks\Spreadsheet\Sheet;
use App\Services\FileTasks\Spreadsheet\SpreadsheetModel;

/**
 * A tartomany sorainak rendezettsege (nem azt, hogy a rendezes eszkozt hasznalta
 * a diak, hanem hogy az adat sorrendben van).
 *
 *   property: `A2:A40`, `A2:C40@2` (a 2. oszlop szerint) vagy munkalappal: `Adatok!A2:C40@2`
 *   expected: `asc` | `desc`, opcionalisan `,num` vagy `,text`;
 *             tobb kulcs: `asc@1;desc@2` (az oszlopok a tartomanyon belul, 1-tol)
 */
final class SortOrderCheck extends SpreadsheetCheck
{
    /** Ennyi sornal hosszabb tartomanyt nem vizsgalunk. */
    private const MAX_ROWS = 20_000;

    public function type(): RubricCheckType
    {
        return RubricCheckType::SortOrder;
    }

    public function validate(string $property, string $expected): ?string
    {
        [$address, $column] = $this->splitProperty($property);

        if (($error = $this->addressError($address)) !== null) {
            return $error;
        }

        $reference = $this->locateAddress($address);

        if ($reference !== null && $reference->height() > self::MAX_ROWS) {
            return self::message('filetasks.sheet_range_too_large', ['max' => self::MAX_ROWS]);
        }

        $keys = $this->keys($expected, $column);

        if ($keys === null) {
            return self::message('filetasks.sort_expected_invalid');
        }

        foreach ($keys as $key) {
            if ($reference !== null && $key['column'] > $reference->width()) {
                return self::message('filetasks.sort_column_outside');
            }
        }

        return null;
    }

    protected function check(SpreadsheetModel $model, string $property, string $expected): CheckOutcome
    {
        [$address, $column] = $this->splitProperty($property);
        $located = $this->locate($model, $address);
        $keys = $this->keys($expected, $column);

        if ($located === null || $keys === null) {
            return CheckOutcome::fail();
        }

        [$sheet, $range] = $located;
        $rows = $this->rows($sheet, $range, $keys);

        if (count($rows) < 2) {
            return CheckOutcome::fail();
        }

        $label = $range->label();
        $numeric = $this->numericKeys($rows, $keys);
        $sorted = $this->isSorted($rows, $keys, $numeric);

        if (count($keys) > 1) {
            return new CheckOutcome($sorted, $label.' '.self::message($sorted ? 'filetasks.sort_ordered' : 'filetasks.sort_unordered'));
        }

        return new CheckOutcome($sorted, $label.' '.$this->describe($rows, $numeric[0] ?? false));
    }

    /** @return array{0: string, 1: int|null} [tartomany cime, rendezesi oszlop] */
    private function splitProperty(string $property): array
    {
        $position = strrpos($property, '@');

        if ($position === false) {
            return [trim($property), null];
        }

        $column = trim(substr($property, $position + 1));

        return [trim(substr($property, 0, $position)), preg_match('/^[1-9][0-9]{0,2}$/', $column) === 1 ? (int) $column : 0];
    }

    private function locateAddress(string $address): ?CellRange
    {
        return CellReference::parse($address)?->range;
    }

    /**
     * A rendezesi kulcsok.
     *
     * @return list<array{column: int, descending: bool, type: string}>|null null, ha az elvart ertek nem ertheto
     */
    private function keys(string $expected, ?int $propertyColumn): ?array
    {
        if ($propertyColumn === 0) {
            return null;
        }

        $keys = [];

        foreach (explode(';', $expected) as $part) {
            if (preg_match('/^\s*(asc|desc)\s*(?:,\s*(num|text))?\s*(?:@\s*([1-9][0-9]{0,2}))?\s*$/i', $part, $match) !== 1) {
                return null;
            }

            $keys[] = [
                'column' => isset($match[3]) ? (int) $match[3] : ($propertyColumn ?? 1),
                'descending' => strtolower($match[1]) === 'desc',
                'type' => strtolower($match[2] ?? 'auto'),
            ];
        }

        return $keys;
    }

    /**
     * A tartomany sorai a kulcsok ertekeivel; azok a sorok maradnak ki, ahol
     * egy kulcs ures (a rendezes az uresket a vegere teszi, es nem rontja a sorrendet).
     *
     * @param  list<array{column: int, descending: bool, type: string}>  $keys
     * @return list<list<Cell>>
     */
    private function rows(Sheet $sheet, CellRange $range, array $keys): array
    {
        $rows = [];

        for ($row = $range->firstRow; $row <= $range->lastRow && count($rows) <= self::MAX_ROWS; $row++) {
            $values = [];

            foreach ($keys as $key) {
                $cell = $sheet->cell($range->firstColumn + $key['column'] - 1, $row);

                if (! $cell instanceof Cell || ! $cell->hasValue()) {
                    continue 2;
                }

                $values[] = $cell;
            }

            $rows[] = $values;
        }

        return $rows;
    }

    /**
     * Kulcsonkent: szamkent rendezendo-e (a kulcs tipusa, vagy ha nincs megadva, az oszlop ertekei donotik el).
     *
     * @param  list<list<Cell>>  $rows
     * @param  list<array{column: int, descending: bool, type: string}>  $keys
     * @return list<bool>
     */
    private function numericKeys(array $rows, array $keys): array
    {
        $numeric = [];

        foreach ($keys as $position => $key) {
            $isNumber = true;

            if ($key['type'] === 'auto') {
                foreach ($rows as $values) {
                    $isNumber = $isNumber && $values[$position]->type === CellType::Number;
                }
            } else {
                $isNumber = $key['type'] === 'num';
            }

            $numeric[] = $isNumber;
        }

        return $numeric;
    }

    /**
     * @param  list<list<Cell>>  $rows
     * @param  list<array{column: int, descending: bool, type: string}>  $keys
     * @param  list<bool>  $numeric
     */
    private function isSorted(array $rows, array $keys, array $numeric): bool
    {
        for ($index = 1; $index < count($rows); $index++) {
            foreach ($keys as $position => $key) {
                $comparison = $this->compare($rows[$index - 1][$position], $rows[$index][$position], $numeric[$position] ?? false);

                if ($comparison === 0) {
                    continue;
                }

                if (($comparison > 0) !== $key['descending']) {
                    return false;
                }

                break;
            }
        }

        return true;
    }

    /** Elojel: negativ, ha $left kisebb. */
    private function compare(Cell $left, Cell $right, bool $numeric): int
    {
        if ($numeric) {
            return ($left->number() ?? 0.0) <=> ($right->number() ?? 0.0);
        }

        return strcmp(Text::fold($left->display()), Text::fold($right->display()));
    }

    /**
     * Az egykulcsos rendezes leirasa a diaknak: novekvo, csokkeno vagy nem rendezett.
     *
     * @param  list<list<Cell>>  $rows
     */
    private function describe(array $rows, bool $numeric): string
    {
        foreach ([false, true] as $descending) {
            $key = ['column' => 1, 'descending' => $descending, 'type' => $numeric ? 'num' : 'text'];

            if ($this->isSorted($rows, [$key], [$numeric])) {
                return self::message($descending ? 'filetasks.sort_descending' : 'filetasks.sort_ascending');
            }
        }

        return self::message('filetasks.sort_unordered');
    }
}
