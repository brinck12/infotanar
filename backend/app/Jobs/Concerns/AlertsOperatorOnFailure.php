<?php

declare(strict_types=1);

namespace App\Jobs\Concerns;

use App\Support\Alerts\OperatorAlert;
use Throwable;

/**
 * A job vegleges bukasakor riasztja az uzemeltetot, a job sajat
 * azonositoival (pl. melyik szamla). Enelkul a hiba csak a failed_jobs
 * tablaban latszana, amit senki nem nez.
 */
trait AlertsOperatorOnFailure
{
    public function failed(?Throwable $exception): void
    {
        app(OperatorAlert::class)->raise(
            __('alerts.job_failed', ['job' => class_basename($this)]),
            [...$this->alertContext(), 'error' => $exception?->getMessage()],
        );
    }

    /**
     * A hiba beazonositasahoz kello azonositok.
     *
     * @return array<string, int|string>
     */
    protected function alertContext(): array
    {
        return [];
    }
}
