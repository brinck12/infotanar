<?php

declare(strict_types=1);

return [
    /*
    |--------------------------------------------------------------------------
    | Megorzesi idoszakok (PRIV-4)
    |--------------------------------------------------------------------------
    | Az `audit:prune` parancs (routes/console.php) ezeket alkalmazza. A veglegeses
    | idoszakokat a jogasz hatarozza meg.
    */

    // Ennyi nap utan az audit naplo IP-cime nullazodik (a sor marad).
    'audit_ip_retention_days' => (int) env('AUDIT_IP_RETENTION_DAYS', 90),

    // Ennyi ev utan az audit sorok torlodnek. Ures ertek: nem torlunk (jogaszi dontesig).
    'audit_delete_after_years' => env('AUDIT_DELETE_AFTER_YEARS') === null || env('AUDIT_DELETE_AFTER_YEARS') === ''
        ? null
        : (int) env('AUDIT_DELETE_AFTER_YEARS'),
];
