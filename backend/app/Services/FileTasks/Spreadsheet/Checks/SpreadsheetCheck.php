<?php

declare(strict_types=1);

namespace App\Services\FileTasks\Spreadsheet\Checks;

use App\Models\RubricItem;
use App\Services\FileTasks\CheckHandler;
use App\Services\FileTasks\CheckOutcome;
use App\Services\FileTasks\OpenedFile;
use App\Services\FileTasks\Spreadsheet\CellRange;
use App\Services\FileTasks\Spreadsheet\CellReference;
use App\Services\FileTasks\Spreadsheet\Sheet;
use App\Services\FileTasks\Spreadsheet\SpreadsheetModel;
use LogicException;

/**
 * A tablazatos vizsgalatok kozos alapja: a tamogatott fajl a SpreadsheetModel,
 * a cimzes (`Munka1!B3`, `A1:C9`) feloldasa, es a tipusos evaluate().
 *
 * Az alosztalyok a `check()` metodust valositjak meg a mar tipusos modellel.
 */
abstract class SpreadsheetCheck implements CheckHandler
{
    /** Egy vizsgalat legfeljebb ennyi cellat jar be (a szerkeszto elutasitja a nagyobb tartomanyt). */
    protected const MAX_RANGE_CELLS = 20_000;

    final public function supports(OpenedFile $file): bool
    {
        return $file instanceof SpreadsheetModel;
    }

    final public function evaluate(OpenedFile $file, RubricItem $item): CheckOutcome
    {
        if (! $file instanceof SpreadsheetModel) {
            throw new LogicException('A tablazatos vizsgalat nem tablazatot kapott.');
        }

        return $this->check($file, $item->property, $item->expected);
    }

    /**
     * Magyar szoveg a fordito fajlbol (a larastan a feltetelekben szetszort tipust ad a `__()`-nek).
     *
     * @param  array<string, string|int>  $replace
     */
    final protected static function message(string $key, array $replace = []): string
    {
        $line = __($key, $replace);

        return is_string($line) ? $line : $key;
    }

    abstract protected function check(SpreadsheetModel $model, string $property, string $expected): CheckOutcome;

    /**
     * A cim feloldasa a munkafuzeten; null, ha a cim ervenytelen, vagy nincs
     * ilyen nevu munkalap.
     *
     * @return array{0: Sheet, 1: CellRange}|null
     */
    protected function locate(SpreadsheetModel $model, string $address): ?array
    {
        $reference = CellReference::parse($address);

        if ($reference === null) {
            return null;
        }

        $sheet = $model->sheet($reference->sheet);

        return $sheet === null ? null : [$sheet, $reference->range];
    }

    /** Szerkesztesi hiba a cimre (magyar), vagy null, ha ervenyes. */
    protected function addressError(string $address, bool $singleCell = false): ?string
    {
        $reference = CellReference::parse($address);

        return match (true) {
            $reference === null => self::message('filetasks.sheet_address_invalid'),
            $singleCell && ! $reference->range->isSingleCell() => self::message('filetasks.sheet_address_single_cell'),
            $reference->range->area() > self::MAX_RANGE_CELLS => self::message('filetasks.sheet_range_too_large', ['max' => self::MAX_RANGE_CELLS]),
            default => null,
        };
    }

    /**
     * A tartomany osszes cellajanak [oszlop, sor] helye sorfolytonosan.
     *
     * @return iterable<array{0: int, 1: int}>
     */
    protected function positions(CellRange $range): iterable
    {
        for ($row = $range->firstRow; $row <= $range->lastRow; $row++) {
            for ($column = $range->firstColumn; $column <= $range->lastColumn; $column++) {
                yield [$column, $row];
            }
        }
    }
}
