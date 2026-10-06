<?php

declare(strict_types=1);

namespace App\Support;

use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;

/**
 * Eldonti, hogy az alapertelmezett adatbazis eldobhato-e (#124).
 *
 * A teszt-fixture-ok betoltese minden tablat ujraepit. Ezt csak fejlesztoi
 * vagy teszt kornyezetben, es csak sqlite fajlon engedjuk: igy egy megosztott
 * MySQL-re mutato helyi .env sem torolheto le veletlenul.
 */
final class DisposableDatabase
{
    private const ENVIRONMENTS = ['local', 'testing'];

    private const DRIVER = 'sqlite';

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

        $driver = DB::connection()->getDriverName();

        if ($driver !== self::DRIVER) {
            return sprintf(
                'A teszt-fixture-ok csak %s adatbázisba tölthetők be (jelenleg: %s).',
                self::DRIVER,
                $driver,
            );
        }

        return null;
    }
}
