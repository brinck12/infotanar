<?php

declare(strict_types=1);

namespace App\Enums;

/**
 * Az elofizetes eletciklusanak ertesitesei (#137). Az ertek egyben a
 * `lang/hu/billing.php` `mail` blokkjanak kulcsa.
 */
enum SubscriptionNoticeType: string
{
    case Started = 'started';
    case Renewed = 'renewed';
    case RenewalFailed = 'renewal_failed';
    case RenewalReminder = 'renewal_reminder';
    case CancelScheduled = 'cancel_scheduled';
    case CancelUndone = 'cancel_undone';
    case Ended = 'ended';

    /**
     * A rendszer altal kivaltott esemenyek (callback, utemezett job) tobbszor is
     * megerkezhetnek ugyanarra az idoszakra; ezekrol idoszakonkent egy level megy.
     * A lemondas es a visszavonasa a felhasznalo sajat, ismetelheto muvelete.
     */
    public function oncePerPeriod(): bool
    {
        return match ($this) {
            self::CancelScheduled, self::CancelUndone => false,
            default => true,
        };
    }
}
