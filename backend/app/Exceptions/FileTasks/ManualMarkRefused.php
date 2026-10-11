<?php

declare(strict_types=1);

namespace App\Exceptions\FileTasks;

use App\Exceptions\DomainException;

/**
 * A kezi pontok jelolese nem lehetseges: a beadas nincs ertekelve, a vizsga
 * meg nincs beadva, vagy a megjelolt tetel nem kezi pont.
 */
final class ManualMarkRefused extends DomainException
{
    /** A tetel nincs a beadas eredmenyeben, vagy automatikus pont. */
    public static function notManualItem(): self
    {
        return new self(__('filetasks.manual_mark_not_manual'));
    }

    /** A beadas feldolgozasa nem sikerult, vagy meg nem tortent meg: nincs mit jelolni. */
    public static function notEvaluated(): self
    {
        return new self(__('filetasks.manual_mark_not_evaluated'));
    }

    /** Vizsgaban feltoltott fajlnal a jeloles csak a feladatsor beadasa (ertekelese) utan lehetseges. */
    public static function examNotSubmitted(): self
    {
        return new self(__('filetasks.manual_mark_exam_open'));
    }

    public function status(): int
    {
        return 422;
    }

    public function errors(): array
    {
        return ['marks' => [$this->getMessage()]];
    }
}
