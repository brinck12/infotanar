<?php

declare(strict_types=1);

namespace App\Services\Billing\Szamlazz;

/** A Szamla Agent sikeres valasza: a szamlaszam es (ha kertuk) a PDF. */
final readonly class IssuedInvoice
{
    public function __construct(
        public string $number,
        public ?string $pdf,
    ) {}
}
