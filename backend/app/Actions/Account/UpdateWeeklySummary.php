<?php

declare(strict_types=1);

namespace App\Actions\Account;

use App\Actions\Audit\RecordAuditEvent;
use App\Actions\Consent\RecordConsent;
use App\Enums\AuditAction;
use App\Enums\ConsentType;
use App\Exceptions\Account\WeeklySummaryNeedsVerifiedEmail;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * A heti osszefoglalo e-mail be- es kikapcsolasa. A bekapcsolas hozzajarulaskent
 * rogzul (a level nem szukseges a szolgaltatashoz); ismetelt bekapcsolas nem keszit
 * ujabb sort. Kikapcsolaskor a hozzajarulas-sor marad (bizonyitek), csak a kapcsolo valtozik.
 */
final readonly class UpdateWeeklySummary
{
    public function __construct(
        private RecordConsent $recordConsent,
        private RecordAuditEvent $audit,
    ) {}

    /** @throws WeeklySummaryNeedsVerifiedEmail ha bekapcsolna, de az e-mail-cim nincs megerositve */
    public function handle(User $user, bool $enabled, ?string $privacyVersion): User
    {
        if ($user->weekly_summary_opt_in === $enabled) {
            return $user;
        }

        if ($enabled && $user->email_verified_at === null) {
            throw new WeeklySummaryNeedsVerifiedEmail;
        }

        DB::transaction(function () use ($user, $enabled, $privacyVersion): void {
            $user->forceFill(['weekly_summary_opt_in' => $enabled])->save();

            if ($enabled) {
                $this->recordConsent->handle($user, ConsentType::WeeklySummary, $privacyVersion ?? '');
            }

            $this->audit->handle(
                $enabled ? AuditAction::AccountWeeklySummaryEnabled : AuditAction::AccountWeeklySummaryDisabled,
                $user,
                $user,
            );
        });

        return $user;
    }
}
