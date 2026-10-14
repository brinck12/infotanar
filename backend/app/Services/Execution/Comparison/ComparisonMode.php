<?php

declare(strict_types=1);

namespace App\Services\Execution\Comparison;

/** Hogyan vetjuk ossze a program kimenetet az elvarttal (`exercises.comparison.mode`). */
enum ComparisonMode: string
{
    /** Soronkent, a sorvegi szokozok es a zaro ures sorok nelkul (az eredeti viselkedes). */
    case Exact = 'exact';

    /** Barmilyen szokozzel elvalasztott elemek sorozata; a szokozok es a sortoresek szama nem szamit. */
    case Tokens = 'tokens';

    /** Mint a tokens, de a szamnak ertelmezheto elemek az ertekuk szerint, turessel hasonlitodnak ossze. */
    case Numeric = 'numeric';
}
