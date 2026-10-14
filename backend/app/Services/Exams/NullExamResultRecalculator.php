<?php

declare(strict_types=1);

namespace App\Services\Exams;

use App\Models\ExamAttempt;

/**
 * Helykitolto, amig a vizsgak csomagja nincs beolvasztva: vizsgaprobalkozas
 * addig nem is johet letre, igy nincs mit ujraszamolni.
 */
final class NullExamResultRecalculator implements ExamResultRecalculator
{
    public function recompute(ExamAttempt $attempt): void
    {
        // Szandekosan ures.
    }
}
