<?php

declare(strict_types=1);

namespace App\Services\FileTasks\Spreadsheet\Checks;

use App\Enums\RubricCheckType;
use App\Services\FileTasks\CheckOutcome;
use App\Services\FileTasks\Grammar\Booleans;
use App\Services\FileTasks\Grammar\Lengths;
use App\Services\FileTasks\Grammar\Numbers;
use App\Services\FileTasks\Grammar\PropertyKey;
use App\Services\FileTasks\Grammar\Text;
use App\Services\FileTasks\Spreadsheet\CellRange;
use App\Services\FileTasks\Spreadsheet\CellReference;
use App\Services\FileTasks\Spreadsheet\Sheet;
use App\Services\FileTasks\Spreadsheet\SpreadsheetModel;

/**
 * Munkalap-, oszlop- es sorformazas:
 *   sheet_name            a munkalap neve; `[N]` az N. munkalap, kulonben barmelyik
 *   column_width[A]       oszlopszelesseg; `[Munka2!A]` masik lapon
 *   column_hidden[A]      rejtett-e az oszlop (igen/nem)
 *   row_height[3]         sormagassag
 * Hosszusag: mertekegyseggel (`3cm`, `15mm`, `12pt`) vagy mertekegyseg nelkul:
 * oszlopnal karakter (a program feluleten latott szelesseg), sornal pont.
 */
final class SheetFormatCheck extends SpreadsheetCheck
{
    private const KEYS = ['sheet_name', 'column_width', 'column_hidden', 'row_height'];

    public function type(): RubricCheckType
    {
        return RubricCheckType::SheetFormat;
    }

    public function validate(string $property, string $expected): ?string
    {
        $key = PropertyKey::parse($property);

        if ($key === null || ! in_array($key->key, self::KEYS, true)) {
            return self::message('filetasks.sheet_format_property_invalid', ['list' => implode(', ', self::KEYS)]);
        }

        $expected = trim($expected);

        return match ($key->key) {
            'sheet_name' => $this->nameError($key, $expected),
            'column_width' => $this->columnError($key) ?? ($this->length($expected, columns: true) === null ? self::message('filetasks.length_expected_invalid') : null),
            'column_hidden' => $this->columnError($key) ?? (Booleans::parse($expected) === null ? self::message('filetasks.boolean_expected_invalid') : null),
            default => $this->rowError($key) ?? ($this->length($expected, columns: false) === null ? self::message('filetasks.length_expected_invalid') : null),
        };
    }

    protected function check(SpreadsheetModel $model, string $property, string $expected): CheckOutcome
    {
        $key = PropertyKey::parse($property);

        if ($key === null) {
            return CheckOutcome::fail();
        }

        $expected = trim($expected);

        return match ($key->key) {
            'sheet_name' => $this->checkName($model, $key, $expected),
            'column_width', 'column_hidden' => $this->checkColumn($model, $key, $expected),
            'row_height' => $this->checkRow($model, $key, $expected),
            default => CheckOutcome::fail(),
        };
    }

    private function nameError(PropertyKey $key, string $expected): ?string
    {
        if ($expected === '' || mb_strlen($expected) > 100) {
            return self::message('filetasks.sheet_expected_required');
        }

        return $key->selector !== null && Numbers::parseCount($key->selector) === null ? self::message('filetasks.sheet_format_selector_invalid') : null;
    }

    private function columnError(PropertyKey $key): ?string
    {
        return $this->column($key) === null ? self::message('filetasks.sheet_format_column_invalid') : null;
    }

    private function rowError(PropertyKey $key): ?string
    {
        return $this->row($key) === null ? self::message('filetasks.sheet_format_row_invalid') : null;
    }

    /** @return array{0: string|null, 1: int}|null [munkalap neve, oszlop] */
    private function column(PropertyKey $key): ?array
    {
        $selector = $key->selector ?? '';
        $separator = strrpos($selector, '!');
        $sheet = $separator === false ? null : CellReference::unquote(substr($selector, 0, $separator));
        $letters = trim($separator === false ? $selector : substr($selector, $separator + 1));

        if (preg_match('/^[A-Za-z]{1,3}$/', $letters) !== 1 || ($sheet === '')) {
            return null;
        }

        $column = CellRange::columnIndex($letters);

        return $column <= CellRange::MAX_COLUMN ? [$sheet, $column] : null;
    }

    /** @return array{0: string|null, 1: int}|null [munkalap neve, sor] */
    private function row(PropertyKey $key): ?array
    {
        $selector = $key->selector ?? '';
        $separator = strrpos($selector, '!');
        $sheet = $separator === false ? null : CellReference::unquote(substr($selector, 0, $separator));
        $row = Numbers::parseCount($separator === false ? $selector : substr($selector, $separator + 1));

        return $row === null || $row < 1 || $row > CellRange::MAX_ROW || $sheet === '' ? null : [$sheet, $row];
    }

    /** Az elvart hossz milliméterben; null, ha nem ertheto. */
    private function length(string $expected, bool $columns): ?float
    {
        $millimetres = Lengths::toMillimetres($expected);

        if ($millimetres !== null) {
            return $millimetres;
        }

        $number = Numbers::parse($expected);

        if ($number === null || $number < 0) {
            return null;
        }

        // Mertekegyseg nelkul: oszlopnal karakter, sornal pont.
        return $columns ? Sheet::charactersToMillimetres($number) : $number * 25.4 / 72;
    }

    private function checkName(SpreadsheetModel $model, PropertyKey $key, string $expected): CheckOutcome
    {
        $index = $key->selector === null ? null : Numbers::parseCount($key->selector);
        $names = array_map(static fn (Sheet $sheet): string => $sheet->name, $model->sheets);

        if ($index !== null) {
            $name = $names[$index - 1] ?? null;

            return $name === null ? CheckOutcome::fail() : new CheckOutcome(Text::equals($name, $expected), $name);
        }

        foreach ($names as $name) {
            if (Text::equals($name, $expected)) {
                return CheckOutcome::pass($name);
            }
        }

        return CheckOutcome::fail(implode(', ', array_slice($names, 0, 8)));
    }

    private function checkColumn(SpreadsheetModel $model, PropertyKey $key, string $expected): CheckOutcome
    {
        $target = $this->column($key);
        $sheet = $target === null ? null : $model->sheet($target[0]);

        if ($target === null || $sheet === null) {
            return CheckOutcome::fail();
        }

        if ($key->key === 'column_hidden') {
            $hidden = $sheet->columnHidden($target[1]);

            return new CheckOutcome(Booleans::parse($expected) === $hidden, Booleans::format($hidden));
        }

        $width = $sheet->columnWidth($target[1]);
        $wanted = $this->length($expected, columns: true);

        return new CheckOutcome($wanted !== null && Lengths::close($width, $wanted), Lengths::format($width));
    }

    private function checkRow(SpreadsheetModel $model, PropertyKey $key, string $expected): CheckOutcome
    {
        $target = $this->row($key);
        $sheet = $target === null ? null : $model->sheet($target[0]);

        if ($target === null || $sheet === null) {
            return CheckOutcome::fail();
        }

        $height = $sheet->rowHeight($target[1]) * 25.4 / 72;
        $wanted = $this->length($expected, columns: false);

        return new CheckOutcome($wanted !== null && Lengths::close($height, $wanted), Numbers::format(round($height * 72 / 25.4, 1)).' pt');
    }
}
