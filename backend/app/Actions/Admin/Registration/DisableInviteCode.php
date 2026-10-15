<?php

declare(strict_types=1);

namespace App\Actions\Admin\Registration;

use App\Actions\Audit\RecordAuditEvent;
use App\Enums\AuditAction;
use App\Models\InviteCode;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/** Letiltas, nem torles: a hasznalati tortenet megmarad. Idempotens. */
final readonly class DisableInviteCode
{
    public function __construct(private RecordAuditEvent $audit) {}

    public function handle(InviteCode $invite, User $admin): InviteCode
    {
        if ($invite->disabled_at !== null) {
            return $invite;
        }

        return DB::transaction(function () use ($invite, $admin): InviteCode {
            $invite->forceFill(['disabled_at' => now()])->save();

            $this->audit->handle(AuditAction::InviteCodeDisabled, $admin, $invite);

            return $invite;
        });
    }
}
