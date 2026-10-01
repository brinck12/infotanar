<?php

declare(strict_types=1);

use App\Jobs\ExpireGracePeriods;
use App\Jobs\ProcessDueSubscriptions;
use App\Jobs\RetryPendingInvoices;
use App\Jobs\SyncPendingPayments;
use Illuminate\Support\Facades\Schedule;

// Fut: deploy/systemd/infotanar-scheduler.service (schedule:work).
Schedule::job(new ExpireGracePeriods)->hourly();

// Elveszett Barion callbackek potlasa (#15).
Schedule::job(new SyncPendingPayments)->everyFiveMinutes();

// Elakadt szamlak potlasa (#20).
Schedule::job(new RetryPendingInvoices)->everyFifteenMinutes();

// Megujitasok terhelese es az idoszak vegen lemondott elofizetesek lezarasa (#98).
Schedule::job(new ProcessDueSubscriptions)->hourly();

// Karbantartas (#127): a lejart tokenek es a regi hibas jobok kulonben orokre megmaradnak.
Schedule::command('sanctum:prune-expired --hours=24')->daily();
Schedule::command('queue:prune-failed --hours=720')->daily();
