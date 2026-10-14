<?php

declare(strict_types=1);

namespace App\Enums;

/** Egy fajlbeadas feldolgozasi allapota (`file_submissions.status`). */
enum FileSubmissionStatus: string
{
    /** Eltarolva, de meg nincs ertekelve (vizsgareszhez feltoltott fajl a vizsga beadasaig). */
    case Stored = 'stored';

    /** Ertekelve: a `result` pillanatkep es a pontszam ki van toltve. */
    case Evaluated = 'evaluated';

    /** A fajl nem volt olvashato; az ok az `error` oszlopban van. */
    case Failed = 'failed';

    /**
     * Az API-ban latszo ertek: a frontend `processing | evaluated | failed`
     * erteket var, a `stored` ezert `processing`-kent megy ki.
     */
    public function apiValue(): string
    {
        return $this === self::Stored ? 'processing' : $this->value;
    }
}
