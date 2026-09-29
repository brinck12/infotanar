<?php

declare(strict_types=1);

return [
    /*
    |--------------------------------------------------------------------------
    | Freemium
    |--------------------------------------------------------------------------
    | Uj track-eknel ennyi elso lecke kap alapbol is_free = true jelolest
    | (PRD: "az elso 2 lecke ingyenes"). A jeloles leckenkent atirhato.
    */
    'free_lessons_per_track' => (int) env('CATALOG_FREE_LESSONS_PER_TRACK', 2),
];
