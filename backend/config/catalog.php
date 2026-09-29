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

    /*
    |--------------------------------------------------------------------------
    | Lecke-videok
    |--------------------------------------------------------------------------
    | A videok privat taroloban vannak; a lejatszo rovid eletu, alairt URL-t
    | kap. A lejaratnak eleg hosszunak kell lennie egy lecke megnezesehez, a
    | lejatszo lejarat utan uj URL-t ker.
    */
    'video' => [
        'disk' => env('LESSON_VIDEO_DISK', 'lesson_videos'),
        'url_ttl_minutes' => (int) env('LESSON_VIDEO_URL_TTL_MINUTES', 30),
    ],
];
