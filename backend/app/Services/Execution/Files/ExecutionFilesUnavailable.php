<?php

declare(strict_types=1);

namespace App\Services\Execution\Files;

use RuntimeException;
use Throwable;

/**
 * A feladat adatfajljait nem sikerult a futtatashoz osszekesziteni (hianyzik
 * a tarolorol, vagy a zip nem irhato). Nem a megoldas hibaja: a kiertekeles
 * rendszerhibaval all le, a reszletek a naploba kerulnek.
 */
final class ExecutionFilesUnavailable extends RuntimeException
{
    public static function because(string $reason, ?Throwable $previous = null): self
    {
        return new self($reason, 0, $previous);
    }
}
