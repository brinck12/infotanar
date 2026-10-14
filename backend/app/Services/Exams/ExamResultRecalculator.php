<?php

declare(strict_types=1);

namespace App\Services\Exams;

use App\Models\ExamAttempt;

/**
 * Egy mar ertekelt vizsgaprobalkozas eredmenyenek ujraszamolasa, miutan a
 * diak megjelolt (vagy modositott) egy kezi pontot az egyik feltoltott fajljan.
 *
 * A fajlbeadasok csomagja (SaveManualMarks) csak ezt az interfeszt ismeri,
 * igy nem fugg a vizsgak megvalositasatol. A kotes az AppServiceProviderben
 * van: amig az App\Actions\Exams\RecomputeExamResult osztaly nem letezik,
 * a NullExamResultRecalculator all a helyen; amint letezik (es megvalositja
 * ezt az interfeszt), az lep ervenybe.
 */
interface ExamResultRecalculator
{
    /**
     * Ujraszamolja a probalkozas fajlos reszeit a fajlbeadasok aktualis
     * pontszamabol, es frissiti a `result` pillanatkepet, a `score`-t es a
     * `pending_manual_points`-ot. A szerkesztos reszek tarolt nyers ertekei
     * valtozatlanok maradnak.
     *
     * A hivo tranzakciojaban fut, a fajlbeadas mentese utan. Nem ertekelt
     * (nyitott vagy csak beadott) probalkozason nem csinal semmit.
     */
    public function recompute(ExamAttempt $attempt): void;
}
