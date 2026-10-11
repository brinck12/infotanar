<?php

declare(strict_types=1);

namespace App\Services\FileTasks\Spreadsheet;

/**
 * Teglalap alaku cellatartomany egy munkalapon, 1-tol szamozott oszlopokkal
 * es sorokkal. Egyetlen cella olyan tartomany, amelynek ket sarka egybeesik.
 */
final readonly class CellRange
{
    /** A tablazatkezelok lapmerete (Excel es LibreOffice): XFD oszlop, 1 048 576 sor. */
    public const MAX_COLUMN = 16384;

    public const MAX_ROW = 1048576;

    public function __construct(
        public int $firstColumn,
        public int $firstRow,
        public int $lastColumn,
        public int $lastRow,
    ) {}

    public static function cell(int $column, int $row): self
    {
        return new self($column, $row, $column, $row);
    }

    /**
     * "A1" vagy "A1:C9" alak ($ jelekkel is); null, ha nem ervenyes. A sarkok
     * sorrendje nem szamit ("C9:A1" ugyanaz a tartomany).
     */
    public static function parse(string $text): ?self
    {
        $cell = '\$?([A-Za-z]{1,3})\$?([0-9]{1,7})';

        if (preg_match('/^\s*'.$cell.'(?:\s*:\s*'.$cell.')?\s*$/', $text, $match) !== 1) {
            return null;
        }

        $firstColumn = self::columnIndex($match[1]);
        $firstRow = (int) $match[2];
        $lastColumn = isset($match[3]) ? self::columnIndex($match[3]) : $firstColumn;
        $lastRow = isset($match[4]) ? (int) $match[4] : $firstRow;

        $range = new self(
            min($firstColumn, $lastColumn),
            min($firstRow, $lastRow),
            max($firstColumn, $lastColumn),
            max($firstRow, $lastRow),
        );

        return $range->isOnSheet() ? $range : null;
    }

    /** Oszlopbetuk (A, Z, AA...) => 1-tol szamozott oszlop. */
    public static function columnIndex(string $letters): int
    {
        $index = 0;

        foreach (str_split(strtoupper($letters)) as $letter) {
            $index = $index * 26 + (ord($letter) - 64);
        }

        return $index;
    }

    /** 1-tol szamozott oszlop => oszlopbetuk. */
    public static function columnLetters(int $column): string
    {
        $letters = '';

        while ($column > 0) {
            $remainder = ($column - 1) % 26;
            $letters = chr(65 + $remainder).$letters;
            $column = intdiv($column - 1, 26);
        }

        return $letters;
    }

    /** Egy cella cime, pl. (2, 3) => "B3". */
    public static function address(int $column, int $row): string
    {
        return self::columnLetters($column).$row;
    }

    public function isSingleCell(): bool
    {
        return $this->firstColumn === $this->lastColumn && $this->firstRow === $this->lastRow;
    }

    public function width(): int
    {
        return $this->lastColumn - $this->firstColumn + 1;
    }

    public function height(): int
    {
        return $this->lastRow - $this->firstRow + 1;
    }

    public function area(): int
    {
        return $this->width() * $this->height();
    }

    public function contains(self $other): bool
    {
        return $other->firstColumn >= $this->firstColumn
            && $other->lastColumn <= $this->lastColumn
            && $other->firstRow >= $this->firstRow
            && $other->lastRow <= $this->lastRow;
    }

    public function equals(self $other): bool
    {
        return $this->contains($other) && $other->contains($this);
    }

    /** "B3" vagy "B2:C9". */
    public function label(): string
    {
        $first = self::address($this->firstColumn, $this->firstRow);

        return $this->isSingleCell() ? $first : $first.':'.self::address($this->lastColumn, $this->lastRow);
    }

    private function isOnSheet(): bool
    {
        return $this->firstColumn >= 1 && $this->firstRow >= 1
            && $this->lastColumn <= self::MAX_COLUMN && $this->lastRow <= self::MAX_ROW;
    }
}
