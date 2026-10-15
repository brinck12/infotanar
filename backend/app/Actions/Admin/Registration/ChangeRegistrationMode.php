<?php

declare(strict_types=1);

namespace App\Actions\Admin\Registration;

use App\Actions\Audit\RecordAuditEvent;
use App\Enums\AuditAction;
use App\Enums\RegistrationMode;
use App\Models\User;
use App\Services\Registration\RegistrationGate;
use Illuminate\Support\Facades\DB;

final readonly class ChangeRegistrationMode
{
    public function __construct(private RegistrationGate $gate, private RecordAuditEvent $audit) {}

    public function handle(RegistrationMode $mode, User $admin): void
    {
        DB::transaction(function () use ($mode, $admin): void {
            $previous = $this->gate->mode();
            $this->gate->setMode($mode);

            if ($previous !== $mode) {
                $this->audit->handle(AuditAction::RegistrationModeChanged, $admin, null, ['from' => $previous->value, 'to' => $mode->value]);
            }
        });
    }
}
