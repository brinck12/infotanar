<?php

declare(strict_types=1);

namespace App\Enums;

/**
 * Egy ertekelesi pont allapota egy beadas eredmenyeben
 * (`file_submissions.result.items[].state`; frontend: `RubricState`).
 */
enum RubricState: string
{
    /** Automatikus pont, a vizsgalat teljesult. */
    case Ok = 'ok';

    /** Automatikus pont, a vizsgalat nem teljesult (vagy nem volt mit vizsgalni). */
    case Bad = 'bad';

    /** Kezi pont: az allapot a diak jelolese utan is `manual` marad, a `manual_mark` mutatja a dontest. */
    case Manual = 'manual';
}
