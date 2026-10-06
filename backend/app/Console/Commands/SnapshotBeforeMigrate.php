<?php

declare(strict_types=1);

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Database\Migrations\Migrator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Process;
use SplFileInfo;

/**
 * Gyors helyi mentes a deploy migracioja elott (#129).
 *
 * Az ejszakai mentes (deploy/backup) akar egy napos is lehet; egy rossz
 * migracio utan ebbol allithato vissza a deploy elotti allapot. Csak akkor
 * keszul, ha van futtatando migracio, es csak az utolso nehany marad meg.
 * Nem helyettesiti a szerveren kivuli mentest: ugyanazon a lemezen van.
 */
class SnapshotBeforeMigrate extends Command
{
    protected $signature = 'db:snapshot-before-migrate {--keep=3 : Ennyi korábbi mentés marad meg}';

    protected $description = 'Mentést készít az adatbázisról, ha van futtatandó migráció';

    public function handle(Migrator $migrator): int
    {
        if (DB::connection()->getDriverName() !== 'mysql') {
            $this->info('Kihagyva: a mentés csak MySQL adatbázisról készül.');

            return self::SUCCESS;
        }

        if (! $this->hasPendingMigrations($migrator)) {
            $this->info('Kihagyva: nincs futtatandó migráció.');

            return self::SUCCESS;
        }

        $directory = storage_path('app/private/db-snapshots');
        File::ensureDirectoryExists($directory);
        $file = $directory.'/'.now()->format('Y-m-d_His').'.sql.gz';

        if (! $this->dump($file)) {
            File::delete($file);
            $this->error('A mentés nem sikerült; a migráció nem indul el.');

            return self::FAILURE;
        }

        $this->info('Mentés: '.$file);
        $this->deleteAllButNewest($directory, max(1, (int) $this->option('keep')));

        return self::SUCCESS;
    }

    private function hasPendingMigrations(Migrator $migrator): bool
    {
        // Elso deploy: meg nincs migracios tabla, tehat menteni valo adat sem.
        if (! $migrator->repositoryExists()) {
            return false;
        }

        $files = array_keys($migrator->getMigrationFiles([database_path('migrations')]));

        return array_diff($files, $migrator->getRepository()->getRan()) !== [];
    }

    private function dump(string $file): bool
    {
        /** @var array{host?: string, port?: string|int, database: string, username: string, password?: string} $config */
        $config = DB::connection()->getConfig();

        // A jelszo kornyezeti valtozoban megy, igy nem latszik a folyamatlistaban.
        // A pipefail miatt a mysqldump hibaja nem veszik el a gzip sikere mogott.
        $result = Process::env(['MYSQL_PWD' => $config['password'] ?? '', 'SNAPSHOT_FILE' => $file])
            ->timeout(600)
            ->run([
                'bash', '-o', 'pipefail', '-c', 'mysqldump "$@" | gzip > "$SNAPSHOT_FILE"', 'mysqldump',
                '--single-transaction', '--no-tablespaces',
                '--host='.($config['host'] ?? '127.0.0.1'),
                '--port='.($config['port'] ?? 3306),
                '--user='.$config['username'],
                $config['database'],
            ]);

        if ($result->failed()) {
            $this->line($result->errorOutput());
        }

        return $result->successful();
    }

    private function deleteAllButNewest(string $directory, int $keep): void
    {
        // A fajlnev idobelyeggel kezdodik, ezert a nev szerinti sorrend idorendi.
        $snapshots = collect(File::files($directory))
            ->map(static fn (SplFileInfo $snapshot): string => $snapshot->getPathname())
            ->sortDesc()
            ->values();

        File::delete($snapshots->slice($keep)->all());
    }
}
