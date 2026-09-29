<?php

declare(strict_types=1);

namespace App\Actions\Progress;

use App\Models\Lesson;
use App\Models\LessonCompletion;
use App\Models\User;

/**
 * Idempotens: ismetelt hivas (ujra beadott, mar teljesitett lecke) nem hoz
 * letre uj sort es nem irja felul az elso teljesites idejet. Parhuzamos
 * hivasoknal is biztonsagos, mert az egyedi indexre tamaszkodik
 * (insertOrIgnore), nem egy elozetes "letezik-e" lekerdezesre.
 */
final class MarkLessonComplete
{
    /** @return bool true, ha a lecke most teljesult eloszor */
    public function handle(User $user, Lesson $lesson): bool
    {
        return LessonCompletion::query()->insertOrIgnore([
            'user_id' => $user->id,
            'lesson_id' => $lesson->id,
            'completed_at' => now(),
        ]) === 1;
    }
}
