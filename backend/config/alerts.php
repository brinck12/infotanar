<?php

declare(strict_types=1);

return [
    /*
    |--------------------------------------------------------------------------
    | Uzemeltetoi riasztasok (ADR 0003)
    |--------------------------------------------------------------------------
    | Ide megy level, ha kezi beavatkozas kell: vegleg elbukott job, elutasitott
    | szamla, elakadt fizetes. Ures ertekkel a riasztas csak a naploba kerul.
    */
    'email' => env('ALERT_EMAIL'),

    // Ugyanarrol a hibarol ennyi idon belul csak egy level megy.
    'repeat_after_minutes' => 60,
];
