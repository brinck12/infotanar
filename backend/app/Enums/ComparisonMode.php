<?php

declare(strict_types=1);

namespace App\Enums;

/** Hogyan vetjuk ossze a program kimenetet az elvarttal (#155). */
enum ComparisonMode: string
{
    /** Soronkent, a sorvegi szokozok es a zaro ures sorok nelkul (a korabbi viselkedes). */
    case Exact = 'exact';
    /** Barmilyen szokozzel elvalasztott elemek sorozata; a szokozok es sortorések szama nem szamit. */
    case Tokens = 'tokens';
    /** Mint a tokens, de a szamnak ertelmezheto elemek turessel (tizedesponttal vagy vesszovel) hasonlitodnak ossze. */
    case Numeric = 'numeric';
}
