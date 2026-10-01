<?php

declare(strict_types=1);

namespace App\Exceptions\Catalog;

use App\Exceptions\DomainException;

/** Feladatos lecket nem lehet kezzel kesznek jelolni: az a feladatok megoldasaval teljesul. */
final class LessonHasExercises extends DomainException
{
    public function __construct()
    {
        parent::__construct(__('catalog.lesson_has_exercises'));
    }

    public function status(): int
    {
        return 409;
    }
}
