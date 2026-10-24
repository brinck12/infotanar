<?php

declare(strict_types=1);

namespace App\Actions\Auth\Social;

use App\Actions\Audit\RecordAuditEvent;
use App\Enums\AuditAction;
use App\Models\User;
use Laravel\Sanctum\NewAccessToken;

/** Token kiadasa kozossegi belepes utan; a jelszavas belepessel azonos alaku a valasz (AccessTokenResource). */
final readonly class IssueSocialToken
{
    public function __construct(private RecordAuditEvent $audit) {}

    public function handle(User $user, string $deviceName, AuditAction $action): NewAccessToken
    {
        $token = $user->createToken($deviceName);
        $token->accessToken->setRelation('tokenable', $user);

        $this->audit->handle($action, $user, $user, ['provider' => 'google']);

        return $token;
    }
}
