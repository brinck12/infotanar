<?php

declare(strict_types=1);

namespace App\Support;

use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;

/**
 * Eldonti, hogy az alapertelmezett adatbazis eldobhato-e (#124).
 *
 * A teszt-fixture-ok betoltese minden tablat ujraepit. Ket eset megengedett:
 *  - sqlite fajl fejlesztoi vagy teszt kornyezetben (a helyi Playwright futas);
 *  - MySQL csak teszt kornyezetben, es csak `_test` vegu adatbazison (#126),
 *    igy egy megosztott vagy eles adatbazisra mutato .env nem torolheto le.
 */
final class DisposableDatabase
{
    private const ENVIRONMENTS = ['local', 'testing'];

    private const MYSQL_DATABASE_SUFFIX = '_test';

    /** Az ok, amiert az adatbazis nem dobhato el; null, ha eldobhato. */
    public static function refusal(): ?string
    {
        if (! App::environment(self::ENVIRONMENTS)) {
            return sprintf(
                'A teszt-fixture-ok csak %s környezetben tölthetők be (jelenleg: %s).',
                implode(' vagy ', self::ENVIRONMENTS),
                Config::string('app.env'),
            );
        }

        $connection = DB::connection();

        return match ($connection->getDriverName()) {
            'sqlite' => null,
            'mysql' => self::mysqlRefusal($connection->getDatabaseName()),
            default => sprintf('A teszt-fixture-ok nem tölthetők be %s adatbázisba.', $connection->getDriverName()),
        };
    }

    private static function mysqlRefusal(string $database): ?string
    {
        if (! App::environment('testing')) {
            return 'MySQL adatbázisba a teszt-fixture-ok csak testing környezetben tölthetők be.';
        }

        if (! str_ends_with($database, self::MYSQL_DATABASE_SUFFIX)) {
            return sprintf(
                'A teszt-fixture-ok csak "%s" végű MySQL adatbázisba tölthetők be (jelenleg: %s).',
                self::MYSQL_DATABASE_SUFFIX,
                $database,
            );
        }

        return null;
    }
}
