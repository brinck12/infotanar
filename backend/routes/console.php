<?php

declare(strict_types=1);

use App\Jobs\ExpireGracePeriods;
use Illuminate\Support\Facades\Schedule;

// Fut: deploy/systemd/infotanar-scheduler.service (schedule:work).
Schedule::job(new ExpireGracePeriods)->hourly();
