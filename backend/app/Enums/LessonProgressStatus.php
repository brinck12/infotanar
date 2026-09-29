<?php

declare(strict_types=1);

namespace App\Enums;

enum LessonProgressStatus: string
{
    case NotStarted = 'not_started';
    /** Van beadasa a lecke valamelyik feladatara, de meg nem teljesitette. */
    case InProgress = 'in_progress';
    case Completed = 'completed';
}
