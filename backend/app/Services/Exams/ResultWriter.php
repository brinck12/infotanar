<?php

declare(strict_types=1);

namespace App\Services\Exams;

use App\Models\ExamAttempt;

/**
 * A reszpontokbol osszeallitja a probalkozas eredmeny-pillanatkepet: a `result`
 * reszenkenti listat, az osszpontszamot es a meg fuggo kezi pontokat. Nem
 * ment, es az allapotot sem allitja: azt a hivo teszi.
 */
final class ResultWriter
{
    /** @param list<PartScore> $scores a vizsga sorrendjeben */
    public function write(ExamAttempt $attempt, array $scores): void
    {
        $attempt->result = array_map(static fn (PartScore $score): array => $score->toArray(), $scores);
        $attempt->score = array_sum(array_map(static fn (PartScore $score): int => $score->score, $scores));
        $attempt->max_score = array_sum(array_map(static fn (PartScore $score): int => $score->maxScore, $scores));
        $attempt->pending_manual_points = array_sum(array_map(static fn (PartScore $score): int => $score->pendingManualPoints, $scores));
    }

    /**
     * A tarolt pillanatkep reszei.
     *
     * @return list<PartScore>
     */
    public function read(ExamAttempt $attempt): array
    {
        return array_map(PartScore::fromArray(...), $attempt->result ?? []);
    }
}
