<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Services\Catalog\Media\LessonMediaAuditor;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

/**
 * Arva (nem hasznalt) fajlok es "lelogo" utvonalak jelentese (#158). Nem torol semmit:
 * a torles dontes. Talalatnal figyelmezteto naplobejegyzest is ir, amit a naplofigyeles
 * (#131) felvehet.
 */
final class ReportLessonMedia extends Command
{
    protected $signature = 'lessons:media-report';

    protected $description = 'Arva videó/felirat fájlok és a tárolóból hiányzó hivatkozások jelentése';

    public function handle(LessonMediaAuditor $auditor): int
    {
        $audit = $auditor->audit();

        foreach ($audit->orphans as $path) {
            $this->line("ÁRVA     {$path}");
        }
        foreach ($audit->dangling as $path) {
            $this->line("HIÁNYZIK {$path}");
        }

        if ($audit->isClean()) {
            $this->info('Rendben: nincs árva fájl és nincs hiányzó hivatkozás.');

            return self::SUCCESS;
        }

        Log::warning('Lesson media audit found problems.', [
            'orphans' => count($audit->orphans),
            'dangling' => count($audit->dangling),
        ]);
        $this->warn(sprintf('%d árva fájl, %d hiányzó hivatkozás.', count($audit->orphans), count($audit->dangling)));

        return self::SUCCESS;
    }
}
