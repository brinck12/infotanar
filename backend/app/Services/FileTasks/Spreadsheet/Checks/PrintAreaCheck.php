<?php

declare(strict_types=1);

namespace App\Services\FileTasks\Spreadsheet\Checks;

use App\Enums\RubricCheckType;
use App\Services\FileTasks\CheckOutcome;
use App\Services\FileTasks\Spreadsheet\CellRange;
use App\Services\FileTasks\Spreadsheet\CellReference;
use App\Services\FileTasks\Spreadsheet\SpreadsheetModel;

/**
 * A munkalap nyomtatasi terulete. A tulajdonsag a munkalap neve (ures = az
 * elso munkalap), az elvart ertek a tartomany (`A1:F30`).
 */
final class PrintAreaCheck extends SpreadsheetCheck
{
    public function type(): RubricCheckType
    {
        return RubricCheckType::PrintArea;
    }

    public function validate(string $property, string $expected): ?string
    {
        if (mb_strlen($property) > 100 || str_contains($property, '!')) {
            return self::message('filetasks.print_area_property_invalid');
        }

        return CellRange::parse($expected) === null ? self::message('filetasks.print_area_expected_invalid') : null;
    }

    protected function check(SpreadsheetModel $model, string $property, string $expected): CheckOutcome
    {
        $property = trim($property);
        $sheet = $model->sheet($property === '' ? null : CellReference::unquote($property));
        $wanted = CellRange::parse($expected);

        if ($sheet === null || $wanted === null || $sheet->printAreas === []) {
            return CheckOutcome::fail();
        }

        $found = implode(', ', array_map(static fn (CellRange $area): string => $area->label(), $sheet->printAreas));

        foreach ($sheet->printAreas as $area) {
            if ($area->equals($wanted)) {
                return CheckOutcome::pass($found);
            }
        }

        return CheckOutcome::fail($found);
    }
}
