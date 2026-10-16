<?php

declare(strict_types=1);

namespace App\Actions\Admin\Registration;

use App\Actions\Audit\RecordAuditEvent;
use App\Enums\AuditAction;
use App\Models\InviteCode;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

final readonly class CreateInviteCode
{
    /** Felreertheto (0/O, 1/I) karakterek nelkul: a kodot diktalni is lehet. */
    private const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

    public function __construct(private RecordAuditEvent $audit) {}

    public function handle(User $admin, string $label, ?int $maxUses, ?CarbonImmutable $expiresAt, ?string $code = null): InviteCode
    {
        return DB::transaction(function () use ($admin, $label, $maxUses, $expiresAt, $code): InviteCode {
            $invite = InviteCode::create([
                'code' => $code !== null ? InviteCode::normalize($code) : $this->generate(),
                'label' => $label,
                'max_uses' => $maxUses,
                'expires_at' => $expiresAt,
                'created_by' => $admin->id,
            ])->refresh();

            $this->audit->handle(AuditAction::InviteCodeCreated, $admin, $invite, [
                'label' => $label,
                'max_uses' => $maxUses,
                'expires_at' => $expiresAt?->toIso8601String(),
            ]);

            return $invite;
        });
    }

    private function generate(): string
    {
        do {
            $code = '';
            for ($i = 0; $i < 8; $i++) {
                $code .= self::ALPHABET[random_int(0, strlen(self::ALPHABET) - 1)];
            }
            $code = Str::substr($code, 0, 4).'-'.Str::substr($code, 4);
        } while (InviteCode::query()->where('code', $code)->exists());

        return $code;
    }
}
