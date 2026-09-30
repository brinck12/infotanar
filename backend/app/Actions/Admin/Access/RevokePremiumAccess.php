<?php

declare(strict_types=1);

namespace App\Actions\Admin\Access;

use App\Actions\Audit\RecordAuditEvent;
use App\Enums\AuditAction;
use App\Models\AccessGrant;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/** Lezaras, nem torles: a tortenet (ki adta, ki vonta vissza) megmarad. Idempotens. */
final readonly class RevokePremiumAccess
{
    public function __construct(private RecordAuditEvent $audit) {}

    public function handle(AccessGrant $grant, User $admin): AccessGrant
    {
        if ($grant->revoked_at !== null) {
            return $grant;
        }

        return DB::transaction(function () use ($grant, $admin): AccessGrant {
            $grant->forceFill(['revoked_at' => now(), 'revoked_by' => $admin->id])->save();

            $this->audit->handle(AuditAction::AccessRevoked, $admin, $grant->user, ['grant_id' => $grant->id]);

            return $grant;
        });
    }
}
