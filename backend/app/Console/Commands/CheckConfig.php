<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Support\Config\ProductionConfigAudit;
use Illuminate\Console\Command;

/**
 * A deploy a migracio elott futtatja (#127): blokkolo hibanal megall, mielott
 * barmi megvaltozna a szerveren. A `--strict` kapcsolo az elesiteshez valo:
 * akkor a figyelmeztetesek is megallitjak.
 */
class CheckConfig extends Command
{
    protected $signature = 'app:check-config {--strict : A figyelmeztetések is hibának számítanak}';

    protected $description = 'Ellenőrzi, hogy a konfiguráció alkalmas-e éles üzemre';

    public function handle(ProductionConfigAudit $audit): int
    {
        $problems = $audit->problems();

        if ($problems === []) {
            $this->info('A konfiguráció éles üzemre alkalmas.');

            return self::SUCCESS;
        }

        $strict = (bool) $this->option('strict');
        $failed = false;

        foreach ($problems as $problem) {
            $line = "{$problem->variable}: {$problem->message}";

            if ($problem->blocking || $strict) {
                $this->error("HIBA  {$line}");
                $failed = true;
            } else {
                $this->warn("FIGYELEM  {$line}");
            }
        }

        return $failed ? self::FAILURE : self::SUCCESS;
    }
}
