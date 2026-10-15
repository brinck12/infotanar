<?php

declare(strict_types=1);

namespace App\Services\Registration;

use App\Enums\RegistrationMode;
use App\Models\AppSetting;
use Illuminate\Support\Facades\Config;

/**
 * A regisztracios mod egyetlen forrasa: az adatbazisi beallitas (admin)
 * felulirja az env alaperteket, hogy uzemszeruen, ujrainditas nelkul
 * lehessen kapcsolni.
 */
final class RegistrationGate
{
    public const SETTING_KEY = 'registration_mode';

    public function mode(): RegistrationMode
    {
        $stored = AppSetting::query()->whereKey(self::SETTING_KEY)->value('value');

        return RegistrationMode::tryFrom(is_string($stored) ? $stored : '')
            ?? RegistrationMode::tryFrom(Config::string('registration.mode', 'open'))
            ?? RegistrationMode::Open;
    }

    public function requiresInvite(): bool
    {
        return $this->mode() === RegistrationMode::Invite;
    }

    public function setMode(RegistrationMode $mode): void
    {
        AppSetting::query()->updateOrCreate(['key' => self::SETTING_KEY], ['value' => $mode->value]);
    }
}
