<?php

declare(strict_types=1);

namespace App\Services\FileTasks\Spreadsheet\Checks;

use App\Enums\RubricCheckType;
use App\Services\FileTasks\CheckOutcome;
use App\Services\FileTasks\Spreadsheet\NumberFormatCode;
use App\Services\FileTasks\Spreadsheet\SpreadsheetModel;

/**
 * A cella (vagy a tartomany minden cellaja) szamformatuma. Az elvart ertek
 * formatumkod (`0,00`, `yyyy.mm.dd.`, `# ##0 "Ft"`) vagy formatumcsalad
 * (szam, szazalek, penznem, datum, ido, szoveg, altalanos).
 */
final class NumberFormatCheck extends SpreadsheetCheck
{
    public function type(): RubricCheckType
    {
        return RubricCheckType::NumberFormat;
    }

    public function validate(string $property, string $expected): ?string
    {
        return $this->addressError($property)
            ?? (trim($expected) === '' ? self::message('filetasks.sheet_expected_required') : null);
    }

    protected function check(SpreadsheetModel $model, string $property, string $expected): CheckOutcome
    {
        $located = $this->locate($model, $property);

        if ($located === null) {
            return CheckOutcome::fail();
        }

        [$sheet, $range] = $located;
        $found = null;
        $passed = true;

        foreach ($this->positions($range) as [$column, $row]) {
            $format = NumberFormatCode::parse($sheet->cell($column, $row)->numberFormat ?? NumberFormatCode::GENERAL);
            $found ??= $format->label();

            if (! $format->matches(trim($expected))) {
                $passed = false;
                $found = $format->label();

                break;
            }
        }

        return new CheckOutcome($passed, $found);
    }
}
