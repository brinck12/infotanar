<?php

declare(strict_types=1);

namespace App\Services\Catalog;

use App\Enums\AccessDenial;
use App\Enums\LessonProgressStatus;
use App\Models\Lesson;
use App\Models\Track;

/** Egy lecke oldala a nezo szemszogebol (#143): a lecke, a helye a kepzesi agban es a hozzaferes. */
final readonly class LessonPage
{
    /**
     * @param  Lesson  $lesson  a modullal es a publikalt feladatokkal betoltve
     * @param  AccessDenial|null  $denial  null = a nezo hozzafer a tartalomhoz
     * @param  array<int, true>  $solvedExerciseIds  a nezo altal megoldott feladatok; vendegnel ures
     * @param  LessonProgressStatus|null  $status  a nezo haladasa a leckeben; vendegnel null
     */
    public function __construct(
        public Track $track,
        public Lesson $lesson,
        public ?Lesson $previous,
        public ?Lesson $next,
        public ?AccessDenial $denial,
        public array $solvedExerciseIds,
        public ?LessonProgressStatus $status,
    ) {}
}
