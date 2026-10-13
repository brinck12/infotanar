<?php

declare(strict_types=1);

namespace App\Services\Exams;

use App\Models\ExamAttempt;

/** Egy probalkozas es azok a reszei, amelyekhez mar van feltoltes vagy kodbeadas. */
final readonly class AttemptProgress
{
    /** @param list<PartProgress> $parts a vizsga sorrendjeben */
    public function __construct(
        public ExamAttempt $attempt,
        public array $parts,
    ) {}

    /**
     * A kesz reszek sorszamai (a vizsgalista `completed_parts` mezoje).
     *
     * @return list<int>
     */
    public function completedOrders(): array
    {
        return array_map(static fn (PartProgress $part): int => $part->order, $this->parts);
    }
}
