<?php

declare(strict_types=1);

namespace App\Services\FileTasks;

use App\Models\Exercise;

/**
 * Milyen kiterjesztesu fajlt fogad el egy feltoltos feladat: a feladat
 * `spec.accepted_extensions` listaja, a fajtajahoz illo kiterjesztesekre
 * szukitve. Ha a feladat nem sorol fel semmit (vagy semmi ervenyeset), a
 * fajta teljes listaja ervenyes. Nem feltoltos feladatnal ures.
 */
final class AcceptedExtensions
{
    /** @return list<string> kisbetus kiterjesztesek ponttal, pl. [".xlsx", ".ods"] */
    public static function for(Exercise $exercise): array
    {
        $allowed = $exercise->kind->uploadExtensions();
        $listed = $exercise->spec['accepted_extensions'] ?? null;

        if (! is_array($listed)) {
            return $allowed;
        }

        $accepted = [];

        foreach ($listed as $extension) {
            $extension = is_string($extension) ? mb_strtolower(trim($extension)) : '';

            if (in_array($extension, $allowed, true) && ! in_array($extension, $accepted, true)) {
                $accepted[] = $extension;
            }
        }

        return $accepted === [] ? $allowed : $accepted;
    }
}
