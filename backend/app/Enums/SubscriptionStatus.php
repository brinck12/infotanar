<?php

declare(strict_types=1);

namespace App\Enums;

enum SubscriptionStatus: string
{
    case Active = 'active';
    /** Sikertelen megujitas: a turelmi ido alatt meg van hozzaferes (#16). */
    case PastDue = 'past_due';
    case Canceled = 'canceled';

    /** Az "elo" allapotok: ezekbol egy felhasznalonak egyszerre legfeljebb egy lehet. */
    public function isLive(): bool
    {
        return $this !== self::Canceled;
    }

    /** @return list<self> */
    public static function live(): array
    {
        return array_values(array_filter(self::cases(), static fn (self $status): bool => $status->isLive()));
    }
}
