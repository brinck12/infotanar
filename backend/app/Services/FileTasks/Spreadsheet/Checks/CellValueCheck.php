<?php

declare(strict_types=1);

namespace App\Services\FileTasks\Spreadsheet\Checks;

use App\Enums\RubricCheckType;
use App\Services\FileTasks\CheckOutcome;
use App\Services\FileTasks\Grammar\Booleans;
use App\Services\FileTasks\Grammar\Numbers;
use App\Services\FileTasks\Grammar\Text;
use App\Services\FileTasks\Spreadsheet\Cell;
use App\Services\FileTasks\Spreadsheet\CellRange;
use App\Services\FileTasks\Spreadsheet\CellType;
use App\Services\FileTasks\Spreadsheet\SerialDate;
use App\Services\FileTasks\Spreadsheet\SpreadsheetModel;

/**
 * Egy cella erteke (a fajlba mentett, kiszamolt eredmeny): szam, datum, ido,
 * logikai ertek vagy szoveg; `~reszlet` a szoveg tartalmazasat jelenti.
 */
final class CellValueCheck extends SpreadsheetCheck
{
    public function type(): RubricCheckType
    {
        return RubricCheckType::CellValue;
    }

    public function validate(string $property, string $expected): ?string
    {
        return $this->addressError($property, singleCell: true)
            ?? (trim($expected) === '' ? self::message('filetasks.sheet_expected_required') : null);
    }

    protected function check(SpreadsheetModel $model, string $property, string $expected): CheckOutcome
    {
        $located = $this->locate($model, $property);
        $cell = $located === null ? null : $located[0]->cell($located[1]->firstColumn, $located[1]->firstRow);

        if ($located === null || $cell === null || ($cell->type === CellType::Blank && ! $cell->hasFormula())) {
            return CheckOutcome::fail();
        }

        if ($cell->type === CellType::Blank) {
            // Keplet kiszamolt eredmeny nelkul (a program nem mentette el): nincs mit osszevetni.
            return CheckOutcome::fail(self::message('filetasks.found_no_cached_value'));
        }

        $label = CellRange::address($located[1]->firstColumn, $located[1]->firstRow);
        $found = $label.': '.$cell->display();

        return $this->matches($cell, trim($expected)) ? CheckOutcome::pass($found) : CheckOutcome::fail($found);
    }

    private function matches(Cell $cell, string $expected): bool
    {
        if (str_starts_with($expected, '~')) {
            return Text::contains($cell->display(), substr($expected, 1));
        }

        if ($cell->type === CellType::Boolean) {
            return is_bool($cell->value) && Booleans::parse($expected) === $cell->value;
        }

        if ($cell->type === CellType::Number && is_float($cell->value)) {
            $number = Numbers::parse($expected);

            if ($number !== null) {
                return Numbers::close($cell->value, $number);
            }

            $serial = SerialDate::parseExpected($expected);

            return $serial !== null && abs($cell->value - $serial) < 1e-6;
        }

        return is_string($cell->value) && Text::equals($cell->value, $expected);
    }
}
