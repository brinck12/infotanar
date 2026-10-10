<?php

declare(strict_types=1);

return [
    /*
    |--------------------------------------------------------------------------
    | Reszletes allapot lekerdezese
    |--------------------------------------------------------------------------
    | A /health/ready reszleteit csak admin, vagy az X-Health-Token fejlecben
    | ezt a tokent kuldo hivo (deploy, monitorozas) latja. Nelkule a valasz
    | csak annyit arul el, hogy az oldal mukodik-e.
    */
    'token' => env('HEALTH_TOKEN'),

    /*
    |--------------------------------------------------------------------------
    | Hatterfolyamatok eletjele
    |--------------------------------------------------------------------------
    | Az utemezo percenkent jelez. A worker eletjele az utemezotol fugg (az
    | teszi sorba), es egy hosszu job (pl. szamlakiallitas) mogott varhat is.
    */
    'scheduler_max_age_seconds' => 180,
    'queue_worker_max_age_seconds' => 600,

    /*
    |--------------------------------------------------------------------------
    | Sor
    |--------------------------------------------------------------------------
    | Ennyi varakozas utan figyelmeztetes, illetve hiba. A Barion callback
    | feldolgozasa es a megerosito levelek is a sorban varnak.
    */
    'queue_wait_warn_seconds' => 120,
    'queue_wait_fail_seconds' => 600,

    /*
    |--------------------------------------------------------------------------
    | Lemez es mentes
    |--------------------------------------------------------------------------
    */
    'disk_free_warn_percent' => 10,
    'disk_free_fail_percent' => 3,
    // Ejszakai mentes + tartalek: ket egymast koveto kimaradt futas mar latszik.
    'backup_max_age_hours' => 36,
];
