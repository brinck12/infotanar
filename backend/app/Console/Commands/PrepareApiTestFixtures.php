<?php

namespace App\Console\Commands;

use Database\Seeders\ApiTestSeeder;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;

/**
 * Friss adatbazis + fixture adatok a Playwright API teszteknek (tests/api).
 *
 * Egyetlen artisan parancsba van osszevonva (nem shell-lancolt lepesekbe),
 * mert a tests/api/playwright.config.ts webServer-je Windows alatt cmd.exe-n
 * keresztul futtatja a parancsot, es az idezojelekkel tuzdelt lancolt
 * parancsok ott megbizhatatlanul viselkednek.
 */
class PrepareApiTestFixtures extends Command
{
    protected $signature = 'test:prepare-api-fixtures';

    protected $description = 'Friss sqlite adatbázis és ApiTestSeeder fixture a Playwright API teszteknek';

    public function handle(): int
    {
        $path = database_path('testing.sqlite');

        if (! file_exists($path)) {
            touch($path);
        }

        $this->call('migrate:fresh', ['--force' => true]);
        $this->call('db:seed', ['--class' => ApiTestSeeder::class, '--force' => true]);

        // A rate-limit teszt szamlaloja a cache-ben el (fajl-cache, mert a
        // beepitett PHP szerver kerelmenkent uj folyamatban fut, es az
        // "array" driver nem elne tul egy kerelmet). Ezt is nullazzuk,
        // kulonben egy korabbi futtatas maradek szamlaloja szivarogna at.
        Cache::flush();

        return self::SUCCESS;
    }
}
