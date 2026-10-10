<?php

declare(strict_types=1);

namespace App\Enums;

/** Egy vizsgaprobalkozas modja (`exam_attempts.mode`). */
enum ExamMode: string
{
    /** Vizsgahelyzet: szerveroldali hatarido, lejaratkor automatikus beadas. */
    case Exam = 'exam';

    /** Gyakorlas: nincs hatarido, a diak adja be. */
    case Practice = 'practice';

    public function isTimed(): bool
    {
        return $this === self::Exam;
    }
}
