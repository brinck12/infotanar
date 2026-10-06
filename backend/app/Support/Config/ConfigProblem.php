<?php

declare(strict_types=1);

namespace App\Support\Config;

/**
 * Egy eles uzemre alkalmatlan beallitas (#127).
 *
 * A blokkolo hiba mindig megallitja a deployt (titokszivargas, hasznalhatatlan
 * titkositas). A tobbi az elesiteshez kell: addig figyelmeztetes, szigoru
 * modban hiba.
 */
final readonly class ConfigProblem
{
    public function __construct(
        public string $variable,
        public string $message,
        public bool $blocking = false,
    ) {}
}
