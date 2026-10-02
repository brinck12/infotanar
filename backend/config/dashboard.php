<?php

declare(strict_types=1);

return [
    /*
    |--------------------------------------------------------------------------
    | Admin attekintes (#160)
    |--------------------------------------------------------------------------
    | A napi bontasok ebben az idozonaban ertendok (az adatbazis UTC-ben tarol).
    | A szamok definicioi: docs/architecture.md, "Admin attekintes".
    */
    'timezone' => env('DASHBOARD_TIMEZONE', 'Europe/Budapest'),

    // Ennyi masodpercig tartjuk meg a kiszamolt mutatokat (tartomanyonkent).
    'cache_ttl' => (int) env('DASHBOARD_CACHE_TTL', 300),

    // Ennyi oras fuggo (pending) fizetes mar figyelmet erdemel.
    'pending_payment_hours' => (int) env('DASHBOARD_PENDING_PAYMENT_HOURS', 24),

    // Ennyi beadas utan, elfogadott beadas nelkul "megoldhatatlannak tuno" egy feladat.
    'unsolved_attempts' => (int) env('DASHBOARD_UNSOLVED_ATTEMPTS', 20),
];
