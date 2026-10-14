<?php

declare(strict_types=1);

namespace App\Services\FileTasks;

use RuntimeException;
use Throwable;

/**
 * A feltoltott fajl nem ertelmezheto: serult, csonka, hianyzik egy kotelezo
 * resze, tul nagy egy resze, vagy tiltott szerkezetet (DOCTYPE) tartalmaz.
 *
 * Nem HTTP-hiba: az ertekelo elkapja, a beadas `failed` allapotot kap, es a
 * diak a publicMessage() szoveget latja (a valasz 201 marad, mert a beadas
 * megtortent). A kivetel sajat uzenete belso ok a naplohoz: ne keruljon bele
 * a fajl tartalma.
 */
final class UnreadableFile extends RuntimeException
{
    public function __construct(string $reason = '', ?Throwable $previous = null)
    {
        parent::__construct($reason, 0, $previous);
    }

    /** A diaknak megjelenitheto magyar ok (`file_submissions.error`). */
    public function publicMessage(): string
    {
        return __('filetasks.unreadable');
    }
}
