<?php

declare(strict_types=1);

namespace App\Enums;

/** Egy ertekelesi pont ellenorzesenek modja (`rubric_items.mode`). */
enum RubricMode: string
{
    /** A szerver ellenorzi a feltoltott fajlban. */
    case Auto = 'auto';

    /** A diak veti ossze a mintaval, es o jeloli meg (nincs tanari sor). */
    case Manual = 'manual';
}
