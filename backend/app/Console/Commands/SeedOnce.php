<?php

namespace App\Console\Commands;

use App\Models\Task;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Schema;

/**
 * Egyszeri seed a deploy pipeline szamara.
 *
 * A sima `db:seed` minden deploynal lefutna es felulirna a feladatokat.
 * Ez a parancs csak akkor seedel, ha meg egyetlen feladat sincs — igy
 * biztonsagosan bennehagyhato a deployban, es a kesobb kezzel szerkesztett
 * feladatokat nem bantja.
 */
class SeedOnce extends Command
{
    protected $signature = 'db:seed-once';

    protected $description = 'Betölti a mintaadatokat, de csak ha az adatbázis még üres';

    public function handle(): int
    {
        if (! Schema::hasTable('tasks')) {
            $this->error('A tasks tábla nem létezik. Futtasd előbb a migrációt.');

            return self::FAILURE;
        }

        $existing = Task::count();

        if ($existing > 0) {
            $this->info("Kihagyva: már van {$existing} feladat az adatbázisban.");

            return self::SUCCESS;
        }

        $this->info('Az adatbázis üres, mintaadatok betöltése…');

        $this->call('db:seed', ['--force' => true]);

        $this->info('Betöltve: '.Task::count().' feladat.');

        return self::SUCCESS;
    }
}
