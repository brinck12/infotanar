<?php

declare(strict_types=1);

namespace App\Services\Catalog;

use App\Enums\AccessDenial;
use App\Enums\LessonProgressStatus;
use App\Models\Lesson;
use App\Models\User;
use App\Services\Access\ContentAccess;
use App\Services\Progress\ExerciseStatuses;
use App\Services\Progress\LessonStatuses;

/**
 * A tananyagot nezo szemszoge (#142): melyik lecke zarolt neki, es hol tart
 * benne. Egyszer allitjuk ossze kerelmenkent (allando szamu lekerdezes), es a
 * Resource-ok leckenkent ebbol olvasnak, igy nincs leckenkenti lekerdezes.
 */
final readonly class LessonViewer
{
    private function __construct(
        private ContentAccess $access,
        private ?User $user,
        private ?LessonStatuses $statuses,
        public ExerciseStatuses $exerciseStatuses,
    ) {}

    public static function for(?User $user, ContentAccess $access): self
    {
        // A hozzaferes eldontesehez kello kapcsolatok egyszer toltodnek be, nem leckenkent.
        $user?->loadMissing(['liveSubscription', 'activeAccessGrant']);

        return new self($access, $user, $user === null ? null : LessonStatuses::forUser($user), ExerciseStatuses::for($user));
    }

    public function denial(Lesson $lesson): ?AccessDenial
    {
        return $this->access->denialFor($this->user, $lesson);
    }

    /** Null vendegnel: neki nincs haladasa. */
    public function status(Lesson $lesson): ?LessonProgressStatus
    {
        return $this->statuses?->of($lesson->id);
    }
}
