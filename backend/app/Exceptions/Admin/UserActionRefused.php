<?php

declare(strict_types=1);

namespace App\Exceptions\Admin;

use App\Exceptions\DomainException;

/** Egy admin muvelet a felhasznalo jelenlegi allapota miatt nem vegezheto el (#162). */
final class UserActionRefused extends DomainException
{
    private function __construct(string $message, private readonly int $httpStatus)
    {
        parent::__construct($message);
    }

    /** Az utolso admin lefokozasa utan senki nem tudna adminkent bejelentkezni. */
    public static function lastAdmin(): self
    {
        return new self(__('admin.users.last_admin'), 409);
    }

    public static function alreadyVerified(): self
    {
        return new self(__('admin.users.already_verified'), 409);
    }

    public static function passwordResetThrottled(): self
    {
        return new self(__('admin.users.password_reset_throttled'), 429);
    }

    public function status(): int
    {
        return $this->httpStatus;
    }
}
