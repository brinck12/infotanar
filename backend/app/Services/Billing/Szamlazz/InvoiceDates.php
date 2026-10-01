<?php

declare(strict_types=1);

namespace App\Services\Billing\Szamlazz;

use Carbon\CarbonInterface;

/**
 * A szamla naptari napjai a szamlazas idozonajaban (#125).
 *
 * Az alkalmazas UTC-ben tarol, a szamlan viszont magyar naptari nap all: egy
 * 00:30-kor (Budapest) beerkezett fizetes UTC szerint meg az elozo napra esne.
 * A kelt a tenyleges kiallitas napja, a teljesites a fizetese: kesleltetett
 * kiallitasnal (ujraprobalas, admin ujrakuldes) a ketto elter.
 */
final readonly class InvoiceDates
{
    private function __construct(
        public string $issued,
        public string $fulfilled,
    ) {}

    public static function in(string $timezone, CarbonInterface $issuedAt, CarbonInterface $paidAt): self
    {
        return new self(
            issued: self::day($issuedAt, $timezone),
            fulfilled: self::day($paidAt, $timezone),
        );
    }

    private static function day(CarbonInterface $moment, string $timezone): string
    {
        // Masolaton valtunk idozonat: a modell datum-attributuma modosithato Carbon lehet.
        return $moment->toImmutable()->setTimezone($timezone)->toDateString();
    }
}
