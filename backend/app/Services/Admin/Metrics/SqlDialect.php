<?php

declare(strict_types=1);

namespace App\Services\Admin\Metrics;

use Illuminate\Support\Facades\DB;
use RuntimeException;

/**
 * Az az egy hely, ahol a mutatok SQL-je adatbazis-fuggo (#160): fejlesztesben SQLite, eles
 * kornyezetben MySQL fut. Ha egy harmadik adatbazis jon, itt kell megtanitani.
 */
final class SqlDialect
{
    /**
     * `Y-m-d` helyi nap egy UTC idobelyeg-oszlopbol, fix masodperc-eltolassal.
     *
     * @param  string  $column  Megbizhato (nem felhasznaloi) oszlopnev.
     */
    public function localDate(string $column, int $offsetSeconds): string
    {
        return match (DB::connection()->getDriverName()) {
            'sqlite' => sprintf("date(%s, '%+d seconds')", $column, $offsetSeconds),
            'mysql', 'mariadb' => sprintf('DATE(DATE_ADD(%s, INTERVAL %d SECOND))', $column, $offsetSeconds),
            default => throw new RuntimeException('The dashboard metrics do not support this database driver.'),
        };
    }
}
