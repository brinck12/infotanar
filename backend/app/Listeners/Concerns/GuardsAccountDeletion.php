<?php

declare(strict_types=1);

namespace App\Listeners\Concerns;

use App\Events\AccountDeleted;
use App\Support\Alerts\OperatorAlert;
use Closure;
use Throwable;

/**
 * A fiok torlesekor futo takaritok egymastol fuggetlenek: egy hiba ne allitsa meg a tobbit,
 * es ne maradjon naplo nelkul. A hiba naplozodik es riaszt (csak azonositokkal); a
 * maradekot a PruneExpiredFileSubmissions soproje ujra elvegzi, ezert a listenerek idempotensek.
 */
trait GuardsAccountDeletion
{
    /** @param Closure(): void $work */
    private function guarded(AccountDeleted $event, Closure $work): void
    {
        try {
            $work();
        } catch (Throwable $exception) {
            report($exception);

            app(OperatorAlert::class)->raise(
                __('alerts.account_purge_failed', ['listener' => class_basename(static::class)]),
                ['user_id' => $event->user->id, 'listener' => class_basename(static::class)],
            );
        }
    }
}
