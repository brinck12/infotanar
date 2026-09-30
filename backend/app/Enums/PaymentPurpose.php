<?php

declare(strict_types=1);

namespace App\Enums;

enum PaymentPurpose: string
{
    /** Elso fizetes: a vasarlo a Barion oldalan fizet, es a kartyaja tokenkent regisztralodik. */
    case Initial = 'initial';
    /** Havi megujitas: a tarolt kartya terhelese a vasarlo jelenlete nelkul (#16). */
    case Renewal = 'renewal';
}
