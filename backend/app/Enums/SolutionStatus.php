<?php

declare(strict_types=1);

namespace App\Enums;

/** A mintamegoldas allapota egy diak szamara (#154). A kliens a `value`-ra agazik el. */
enum SolutionStatus: string
{
    /** Meg nem nyithato meg: nincs elfogadott beadas, es nincs eleg sikertelen. */
    case Locked = 'locked';
    /** Elegendo sikertelen beadas van: kifejezett megerositessel megnyithato. */
    case Revealable = 'revealable';
    /** Elfogadott beadas vagy korabbi megnyitas miatt lathato. */
    case Unlocked = 'unlocked';
}
