<?php

declare(strict_types=1);

namespace App\Actions\Progress;

use App\Exceptions\Access\PremiumContentLocked;
use App\Exceptions\Catalog\LessonHasExercises;
use App\Models\Lesson;
use App\Models\User;
use App\Services\Access\ContentAccess;

/**
 * Feladat nelkuli (csak elmelet vagy video) lecke kesznek jelolese (#144).
 * Az ilyen lecket beadas nem tudja teljesiteni, ezert a diak maga jeloli meg.
 * Feladatos leckenel tovabbra is a feladatok megoldasa az egyetlen ut.
 *
 * A teljesites megmarad akkor is, ha a leckehez kesobb feladat kerul.
 */
final readonly class CompleteTheoryLesson
{
    public function __construct(
        private ContentAccess $access,
        private MarkLessonComplete $markLessonComplete,
    ) {}

    /**
     * @return bool true, ha a lecke most teljesult eloszor
     *
     * @throws PremiumContentLocked
     * @throws LessonHasExercises
     */
    public function handle(User $user, Lesson $lesson): bool
    {
        $denial = $this->access->denialFor($user, $lesson);
        if ($denial !== null) {
            throw new PremiumContentLocked($denial);
        }

        if ($lesson->exercises()->where('is_published', true)->exists()) {
            throw new LessonHasExercises;
        }

        return $this->markLessonComplete->handle($user, $lesson);
    }
}
