<?php

declare(strict_types=1);

namespace App\Enums;

/** Hol tart a diak egy feladattal. Akinek nincs beadasa, annak nincs allapota (null). */
enum ExerciseProgressStatus: string
{
    /** Van elfogadott beadasa. */
    case Solved = 'solved';
    /** Van beadasa, de egyik sem lett elfogadva. */
    case Attempted = 'attempted';
}
