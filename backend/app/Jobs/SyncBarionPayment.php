<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Actions\Billing\SyncPaymentState;
use App\Models\Payment;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

/**
 * A callback es a potlo sweep kozos belepesi pontja. Sorba tesszuk, hogy a
 * Barion 15 mp-en belul megkapja a 200-at, es hogy egy atmeneti Barion-hiba
 * utan ujraprobalhassuk. Fizetesenkent egyszerre csak egy fut.
 */
final class SyncBarionPayment implements ShouldBeUnique, ShouldQueue
{
    use Queueable;

    public int $tries = 5;

    /** @var list<int> */
    public array $backoff = [10, 30, 120, 600];

    public int $uniqueFor = 120;

    public function __construct(public readonly int $paymentId) {}

    public function uniqueId(): string
    {
        return (string) $this->paymentId;
    }

    public function handle(SyncPaymentState $sync): void
    {
        $payment = Payment::query()->find($this->paymentId);

        if ($payment !== null) {
            $sync->handle($payment);
        }
    }
}
