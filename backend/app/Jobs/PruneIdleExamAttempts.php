<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Jobs\Concerns\AlertsOperatorOnFailure;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

/**
 * Utemezett sweep (orankent): az exams.idle_days napja tetlen, nyitott
 * gyakorlo probalkozasokat lezarja. Amelyikben van feltoltes vagy beadas, azt
 * beadja es ertekeli; az ureset torli.
 *
 * Az utemezes a routes/console.php-ben van. A torzset a vizsgak csomagja
 * (WP6) irja meg; addig a job szandekosan nem csinal semmit.
 */
final class PruneIdleExamAttempts implements ShouldBeUnique, ShouldQueue
{
    use AlertsOperatorOnFailure, Queueable;

    public function handle(): void
    {
        // WP6.
    }
}
