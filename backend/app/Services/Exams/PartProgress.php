<?php

declare(strict_types=1);

namespace App\Services\Exams;

use Illuminate\Support\Carbon;

/** Egy vizsgaresz kesz allapota egy probalkozasban: a feltoltott fajl vagy a legjobb kodbeadas. */
final readonly class PartProgress
{
    public function __construct(
        public int $partId,
        /** A resz 1-tol szamolt sorszama. */
        public int $order,
        /** Feltoltott fajl neve, szerkesztos reszen `megoldas.py` / `.cs` / `.sql`. */
        public string $fileName,
        public Carbon $uploadedAt,
    ) {}
}
