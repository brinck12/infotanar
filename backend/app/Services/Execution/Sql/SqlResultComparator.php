<?php

declare(strict_types=1);

namespace App\Services\Execution\Sql;

/**
 * Ket CSV eredmenyhalmaz osszevetese (sqlite3 `.headers on` + `.mode csv`).
 *
 * - Az oszlopneveket nem hasonlitjuk (alias-szabadsag: `COUNT(*)` vs
 *   `COUNT(*) AS db`), csak az oszlopok szamat es az ertekeket, pozicio szerint.
 * - A sorok sorrendje alapbol nem szamit (multihalmaz-osszevetes); ha a feladat
 *   rendezest ker, `orderSensitive` eseten igen.
 */
final class SqlResultComparator
{
    public function matches(string $actualCsv, string $expectedCsv, bool $orderSensitive): bool
    {
        $actual = $this->parse($actualCsv);
        $expected = $this->parse($expectedCsv);

        if ($actual['columns'] !== $expected['columns']) {
            return false;
        }

        $actualRows = $actual['rows'];
        $expectedRows = $expected['rows'];

        if (! $orderSensitive) {
            sort($actualRows);
            sort($expectedRows);
        }

        return $actualRows === $expectedRows;
    }

    /** @return array{columns: int, rows: list<string>} */
    private function parse(string $csv): array
    {
        $lines = array_values(array_filter(
            preg_split('/\r\n|\n|\r/', trim($csv)) ?: [],
            static fn (string $line): bool => $line !== '',
        ));

        if ($lines === []) {
            // Ures eredmeny: fejlec sincs (a sqlite3 ures eredmenynel nem ir fejlecet).
            return ['columns' => 0, 'rows' => []];
        }

        $header = str_getcsv(array_shift($lines), escape: '');
        $rows = array_map(
            static fn (string $line): string => json_encode(
                array_map(self::normalizeValue(...), str_getcsv($line, escape: '')),
                JSON_THROW_ON_ERROR,
            ),
            $lines,
        );

        return ['columns' => count($header), 'rows' => $rows];
    }

    /** 3 == 3.0, es a sorvegi szokozok ne szamitsanak. */
    private static function normalizeValue(?string $value): string
    {
        $value = trim((string) $value);

        return is_numeric($value) ? (string) (0 + $value) : $value;
    }
}
