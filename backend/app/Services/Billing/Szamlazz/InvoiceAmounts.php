<?php

declare(strict_types=1);

namespace App\Services\Billing\Szamlazz;

/**
 * Brutto arbol netto/AFA bontas egesz forintra. Adomentes kodnal (pl. AAM,
 * TAM) nincs AFA; szamkulcsnal a netto kerekitett, az AFA a kulonbseg, igy
 * netto + AFA mindig pontosan a fizetett brutto.
 */
final readonly class InvoiceAmounts
{
    private function __construct(
        public string $vatRate,
        public int $net,
        public int $vat,
        public int $gross,
    ) {}

    public static function fromGross(int $gross, string $vatRate): self
    {
        if (! is_numeric($vatRate)) {
            return new self($vatRate, $gross, 0, $gross);
        }

        $net = (int) round($gross / (1 + ((float) $vatRate) / 100));

        return new self($vatRate, $net, $gross - $net, $gross);
    }
}
