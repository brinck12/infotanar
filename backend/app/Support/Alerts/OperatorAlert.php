<?php

declare(strict_types=1);

namespace App\Support\Alerts;

use App\Notifications\OperatorAlertNotification;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;
use Throwable;

/**
 * Riasztas az uzemeltetonek, ha valami kezi beavatkozast igenyel (ADR 0003).
 *
 * Mindig naplozunk; levelet akkor kuldunk, ha van ALERT_EMAIL. A level
 * azonnal megy, nem sorbol: a riasztas gyakran epp arrol szol, hogy a sor all.
 * A kontextusba csak azonositok keruljenek, szemelyes adat es forraskod ne.
 */
final class OperatorAlert
{
    /** @param array<string, int|string|null> $context */
    public function raise(string $summary, array $context = []): void
    {
        Log::critical($summary, $context);

        $recipient = Config::get('alerts.email');

        if (! is_string($recipient) || $recipient === '' || ! $this->firstInWindow($summary, $context)) {
            return;
        }

        try {
            Notification::route('mail', $recipient)->notifyNow(new OperatorAlertNotification($summary, $context));
        } catch (Throwable $e) {
            // A riasztas nem buktathatja meg azt a folyamatot, amelyik jelez.
            Log::error('Operator alert e-mail could not be sent.', ['error' => $e->getMessage()]);
        }
    }

    /**
     * Egy ujraprobalkozo sweep ugyanazt a hibat orankent tobbszor is jelezne.
     *
     * @param  array<string, int|string|null>  $context
     */
    private function firstInWindow(string $summary, array $context): bool
    {
        $key = 'alerts.sent.'.sha1($summary.'|'.json_encode($context));

        return Cache::add($key, true, now()->addMinutes(Config::integer('alerts.repeat_after_minutes')));
    }
}
