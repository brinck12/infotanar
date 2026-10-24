<?php

declare(strict_types=1);

namespace App\Services\Auth\Social;

/** A szolgaltato altal igazolt adatok; csak ennyit tartunk meg a belepeshez. */
final readonly class SocialProfile
{
    public function __construct(
        public string $provider,
        public string $providerUserId,
        public string $email,
        public bool $emailVerified,
        public string $name,
    ) {}

    /** @return array{provider: string, provider_user_id: string, email: string, email_verified: bool, name: string} */
    public function toArray(): array
    {
        return [
            'provider' => $this->provider,
            'provider_user_id' => $this->providerUserId,
            'email' => $this->email,
            'email_verified' => $this->emailVerified,
            'name' => $this->name,
        ];
    }

    /** @param array<mixed> $data */
    public static function fromArray(array $data): self
    {
        return new self(
            provider: is_string($data['provider'] ?? null) ? $data['provider'] : '',
            providerUserId: is_string($data['provider_user_id'] ?? null) ? $data['provider_user_id'] : '',
            email: is_string($data['email'] ?? null) ? $data['email'] : '',
            emailVerified: ($data['email_verified'] ?? false) === true,
            name: is_string($data['name'] ?? null) ? $data['name'] : '',
        );
    }
}
