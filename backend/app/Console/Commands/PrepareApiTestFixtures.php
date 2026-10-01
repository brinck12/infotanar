<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Support\DisposableDatabase;
use Database\Seeders\ApiTestSeeder;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\File;

/**
 * Friss adatbazis + fixture adatok a Playwright API teszteknek (tests/api).
 *
 * Egyetlen artisan parancsba van osszevonva (nem shell-lancolt lepesekbe),
 * mert a tests/api/playwright.config.ts webServer-je Windows alatt cmd.exe-n
 * keresztul futtatja a parancsot, es az idezojelekkel tuzdelt lancolt
 * parancsok ott megbizhatatlanul viselkednek.
 *
 * A migrate:fresh minden tablat eldob, ezert a parancs csak eldobhato
 * adatbazison fut (DisposableDatabase, #124).
 */
class PrepareApiTestFixtures extends Command
{
    protected $signature = 'test:prepare-api-fixtures';

    protected $description = 'Friss sqlite adatbázis és ApiTestSeeder fixture a Playwright API teszteknek';

    /** Eles kornyezetben a parancs a listaban sem jelenik meg. */
    public function isHidden(): bool
    {
        return DisposableDatabase::refusal() !== null;
    }

    public function handle(): int
    {
        $refusal = DisposableDatabase::refusal();

        if ($refusal !== null) {
            $this->error($refusal);

            return self::FAILURE;
        }

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

        File::deleteDirectory(storage_path('framework/outbox'));

        return self::SUCCESS;
    }
}
