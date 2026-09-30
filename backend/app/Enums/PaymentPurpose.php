<?php

declare(strict_types=1);

namespace App\Enums;

enum PaymentPurpose: string
{
    /** Elso fizetes: a vasarlo a Barion oldalan fizet, es a kartyaja tokenkent regisztralodik. */
    case Initial = 'initial';

    /** Havi megujitas: a tarolt kartya terhelese a vasarlo jelenlete nelkul (#98). */
    case Renewal = 'renewal';

    /**
     * Kartyacsere (#17): a kovetkezo honap elore kifizetese az uj kartyaval,
     * amely sikeres token-regisztracio utan a tovabbi megujitasok kartyaja lesz.
     */
    case CardChange = 'card_change';

    /** Egy mar meglevo elofizeteshez tartozik-e (szemben az elsovel, amely letrehozza). */
    public function continuesSubscription(): bool
    {
        return $this !== self::Initial;
    }

    /** Uj kartya-tokent regisztral-e (a vasarlo a Barion oldalan fizet). */
    public function registersCard(): bool
    {
        return $this !== self::Renewal;
    }
}
