<?php

declare(strict_types=1);

return [
    /*
    |--------------------------------------------------------------------------
    | Regisztracios kapu (LAUNCH-2)
    |--------------------------------------------------------------------------
    | open   = barki regisztralhat (alapertelmezes helyben),
    | invite = csak ervenyes meghivokoddal (zart beta; ELESBEN ERRE ALLITANDO).
    | Az admin felulbirálhatja az adatbazisban (app_settings: registration_mode),
    | ez az env csak az alapertek, ha az adatbazisban nincs bejegyzes.
    */
    'mode' => env('REGISTRATION_MODE', 'open'),

    'rate' => [
        // Regisztracio IP-nkent (B03); a teszt-backend felemeli.
        'register_per_minute' => (int) env('REGISTRATION_RATE_REGISTER_PER_MINUTE', 10),
        // Varolista: barki hivhatja, ezert szuk.
        'waitlist_per_minute' => (int) env('REGISTRATION_RATE_WAITLIST_PER_MINUTE', 5),
    ],
];
