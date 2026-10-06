<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Services\Health\Heartbeat;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

/**
 * A queue worker eletjele (#130): az utemezo percenkent sorba teszi, a
 * worker a lefuttatasaval jelez. Egyedi, hogy allo worker mellett ne
 * gyuljon fel belole percenkent egy a sorban.
 */
final class RecordQueueHeartbeat implements ShouldBeUnique, ShouldQueue
{
    use Queueable;

    public int $tries = 1;

    public int $uniqueFor = 600;

    public function handle(): void
    {
        Heartbeat::beat(Heartbeat::QUEUE_WORKER);
    }
}
