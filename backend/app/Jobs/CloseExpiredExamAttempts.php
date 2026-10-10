<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Jobs\Concerns\AlertsOperatorOnFailure;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

/**
 * Utemezett sweep (percenkent): lezarja es ertekeli a lejart vizsgahelyzetu
 * probalkozasokat (`deadline_at` + exams.grace_seconds elmult), azoknak a
 * diakoknak, akik bezartak a bongeszot; es ujraprobalja a `submitted`
 * allapotban ragadt probalkozasok ertekeleset. Egy futasban legfeljebb
 * exams.close_batch probalkozas, mindegyik sajat tranzakcioban.
 *
 * Az utemezes a routes/console.php-ben van. A torzset a vizsgak csomagja
 * (WP6) irja meg; addig a job szandekosan nem csinal semmit.
 */
final class CloseExpiredExamAttempts implements ShouldBeUnique, ShouldQueue
{
    use AlertsOperatorOnFailure, Queueable;

    public function handle(): void
    {
        // WP6.
    }
}
