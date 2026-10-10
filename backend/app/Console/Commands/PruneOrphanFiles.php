<?php

declare(strict_types=1);

namespace App\Console\Commands;

use Illuminate\Console\Command;

/**
 * Arva fajlok takaritasa a privat tarolokon (hetente, routes/console.php).
 *
 * A `submission_files` tarolorol torli azokat az egy napnal regebbi fajlokat,
 * amelyekhez nincs `file_submissions` sor. Az `exercise_files` tarolon csak
 * jelent: szerzoi tartalmat soha nem torlunk automatikusan.
 *
 * A torzset a haladas es adatvedelem csomagja (WP8) irja meg; addig a
 * parancs szandekosan nem csinal semmit.
 */
class PruneOrphanFiles extends Command
{
    protected $signature = 'files:prune-orphans';

    protected $description = 'Sor nélküli fájlok törlése a beadások tárolójáról, és jelentés a feladatfájlok tárolójáról';

    public function handle(): int
    {
        // WP8.
        return self::SUCCESS;
    }
}
