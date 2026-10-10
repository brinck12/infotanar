<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Jobs\Concerns\AlertsOperatorOnFailure;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

/**
 * Utemezett megorzesi takaritas (naponta): torli a filetasks.retention_days
 * napnal regebbi gyakorlo fajlbeadasokat es vizsgaprobalkozasokat, a
 * fajljaikkal egyutt (elobb a fajl, utana a sor).
 *
 * Az utemezes a routes/console.php-ben van. A torzset a haladas es adatvedelem
 * csomagja (WP8) irja meg; addig a job szandekosan nem csinal semmit.
 */
final class PruneExpiredFileSubmissions implements ShouldBeUnique, ShouldQueue
{
    use AlertsOperatorOnFailure, Queueable;

    public function handle(): void
    {
        // WP8.
    }
}
