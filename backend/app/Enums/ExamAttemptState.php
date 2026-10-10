<?php

declare(strict_types=1);

namespace App\Enums;

/** Egy vizsgaprobalkozas allapota (`exam_attempts.state`). */
enum ExamAttemptState: string
{
    /** Nyitott: feltoltes es kodbeadas meg lehetseges. Felhasznalonkent es vizsgankent legfeljebb egy. */
    case InProgress = 'in_progress';

    /** Beadva, az ertekeles meg nem fejezodott be (atmeneti; a job ujraprobalja). */
    case Submitted = 'submitted';

    /** Ertekelve: a pontszam es a `result` pillanatkep ki van toltve. */
    case Evaluated = 'evaluated';

    public function isOpen(): bool
    {
        return $this === self::InProgress;
    }
}
