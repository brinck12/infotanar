<?php

declare(strict_types=1);

namespace App\Services\Billing\Szamlazz;

use RuntimeException;
use Throwable;

/**
 * A Szamla Agent hibaja. Belso hiba (a felhasznalo nem latja): a szamlazas a
 * fizetestol fuggetlenul, sorban fut. `uncertain` eseten nem tudjuk, keszult-e
 * szamla (pl. idotullepes), ezert ujrakuldes elott ra kell kerdezni.
 */
final class SzamlazzException extends RuntimeException
{
    private function __construct(
        string $message,
        public readonly bool $uncertain,
        public readonly bool $retryable,
        ?Throwable $previous = null,
    ) {
        parent::__construct($message, 0, $previous);
    }

    /** A kerest elkuldtuk, de valaszt nem kaptunk: lehet, hogy a szamla elkeszult. */
    public static function uncertain(Throwable $previous): self
    {
        return new self('Szamlazz.hu: no response ('.$previous->getMessage().')', true, true, $previous);
    }

    /** A szolgaltatas atmenetileg hibas (5xx): nem keszult szamla, ujraprobalhato. */
    public static function unavailable(int $status): self
    {
        return new self("Szamlazz.hu: HTTP {$status}", false, true);
    }

    /** Az Agent hibakoddal utasitotta el (pl. hibas adat, rossz kulcs): kezi javitas kell. */
    public static function rejected(string $code, string $message): self
    {
        return new self("Szamlazz.hu error {$code}: {$message}", false, false);
    }

    public static function unexpectedResponse(string $detail): self
    {
        return new self('Szamlazz.hu: unexpected response ('.$detail.')', true, true);
    }

    public static function notConfigured(): self
    {
        return new self('Szamlazz.hu: SZAMLAZZ_AGENT_KEY is not configured', false, true);
    }
}
