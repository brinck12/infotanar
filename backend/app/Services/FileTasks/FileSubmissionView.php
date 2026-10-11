<?php

declare(strict_types=1);

namespace App\Services\FileTasks;

use App\Models\FileSubmission;

/**
 * Egy fajlbeadas ugy, ahogy az API kiadja: a sor es az, ami nem a sorban van,
 * hanem a nezotol es a szomszedos soroktol fugg. A FileSubmissionPresenter
 * allitja ossze, a FileSubmissionResource irja ki.
 */
final readonly class FileSubmissionView
{
    public function __construct(
        /** Az `exercise` kapcsolat betoltve kell legyen (a cim miatt). */
        public FileSubmission $submission,
        /** Az elozo ertekelt gyakorlo probalkozas pontszama; null, ha nem volt. */
        public ?int $previousScore = null,
        /** Alairt URL a feltoltott kephez (csak png es svg); kulonben null. */
        public ?string $previewUrl = null,
        /** Alairt URL a feladat mintakepehez; null, ha nincs, vagy a nezonek a feladat zarolt. */
        public ?string $sampleUrl = null,
    ) {}
}
