<?php

declare(strict_types=1);

namespace App\Services\Execution\Sql;

/**
 * SQL-feladat futtathato programma alakitasa a Judge0 SQLite (sqlite3 CLI)
 * futtatokornyezetehez.
 *
 * Tesztesetenkent a teszteset "bemenete" az adatkeszletet felepito szkript
 * (CREATE TABLE + INSERT), erre jon a diak lekerdezese. A kimenet CSV,
 * fejlecsorral, hogy a SqlResultComparator soronkent vethesse ossze.
 */
final class SqlProgram
{
    private const PREAMBLE = ".bail on\n.headers on\n.mode csv\n";

    public static function build(string $datasetScript, string $studentQuery): string
    {
        return self::PREAMBLE.rtrim($datasetScript)."\n".rtrim($studentQuery)."\n";
    }

    /**
     * A diak kodja csak SQL lehet: a sqlite3 CLI pont-parancsai (.shell,
     * .system, .read, .output ...) a futtatokornyezetet vezerelnek, nem a
     * feladat reszei.
     */
    public static function containsDotCommand(string $studentQuery): bool
    {
        return preg_match('/^\s*\./m', $studentQuery) === 1;
    }
}
