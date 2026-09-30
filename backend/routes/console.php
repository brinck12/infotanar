<?php

declare(strict_types=1);

use App\Jobs\ExpireGracePeriods;
use App\Jobs\SyncPendingPayments;
use Illuminate\Support\Facades\Schedule;

// Fut: deploy/systemd/infotanar-scheduler.service (schedule:work).
Schedule::job(new ExpireGracePeriods)->hourly();

// Elveszett Barion callbackek potlasa (#15).
Schedule::job(new SyncPendingPayments)->everyFiveMinutes();
