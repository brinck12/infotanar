<?php

declare(strict_types=1);

namespace App\Services\Execution\Sql;

use RuntimeException;

/**
 * SQL-feladat futtathato programma alakitasa a Judge0 Python futtatokornyezetehez.
 *
 * Tesztesetenkent a teszteset "bemenete" az adatkeszletet felepito szkript
 * (CREATE TABLE + INSERT), erre jon a diak lekerdezese. A lekerdezes SQLite-on fut,
 * de a `resources/sql/mariadb_runner.py` az erettsegi MariaDB-jenek gyakori
 * fuggvenyeit (YEAR, CONCAT, IF, DATEDIFF, DATE_FORMAT ...) is regisztralja, es a
 * `/` tort osztas, igy a diak azt irja, amit az erettsegin. A kimenet CSV,
 * fejlecsorral, hogy a SqlResultComparator soronkent vethesse ossze.
 */
final class SqlProgram
{
    /** A Judge0 nyelv, amelyen a SQL-feladat programja fut (a config `languages` kulcsa). */
    public const RUNNER_LANGUAGE = 'python';

    private static ?string $template = null;

    public static function build(string $datasetScript, string $studentQuery): string
    {
        return str_replace(
            ['__DATASET_B64__', '__QUERY_B64__'],
            [base64_encode($datasetScript), base64_encode($studentQuery)],
            self::template(),
        );
    }

    /**
     * A diak kodja csak SQL lehet. A sqlite3 CLI pont-parancsai (.shell, .system ...)
     * mar nem leteznek (a lekerdezes a Python sqlite3 modulon megy), de a pont-parancsot
     * tovabbra is elutasitjuk: nem SQL, es felrevezeto hibauzenetet adna.
     */
    public static function containsDotCommand(string $studentQuery): bool
    {
        return preg_match('/^\s*\./m', $studentQuery) === 1;
    }

    private static function template(): string
    {
        if (self::$template === null) {
            $source = file_get_contents(resource_path('sql/mariadb_runner.py'));

            if ($source === false) {
                throw new RuntimeException('Az SQL-futtato program (resources/sql/mariadb_runner.py) nem olvashato.');
            }

            self::$template = $source;
        }

        return self::$template;
    }
}
