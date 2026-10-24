<?php

declare(strict_types=1);

namespace App\Actions\Account;

use App\Actions\Audit\RecordAuditEvent;
use App\Enums\AuditAction;
use App\Models\User;

/**
 * Leiratkozas a heti osszefoglalorol a level linkjerol (bejelentkezes nelkul; az alairas vedi).
 * Idempotens, es ismeretlen vagy torolt fiokra is ugyanazt a semleges valaszt adja:
 * a vegpont nem arulja el, ki hasznalja a szolgaltatast.
 */
final readonly class UnsubscribeWeeklySummary
{
    public function __construct(private RecordAuditEvent $audit) {}

    public function handle(int $userId): void
    {
        $user = User::query()->whereKey($userId)->first();

        if ($user === null || ! $user->weekly_summary_opt_in) {
            return;
        }

        $user->forceFill(['weekly_summary_opt_in' => false])->save();

        $this->audit->handle(AuditAction::AccountWeeklySummaryDisabled, $user, $user, ['via' => 'email_link']);
    }
}
