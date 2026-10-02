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

        // Feltoltes az admin feluleterol (#158): darabokban, hogy egy megszakadt kapcsolat
        // utan onnan folytathato legyen. A darabmeret kisebb legyen az nginx
        // client_max_body_size-anal es a PHP memory_limit-nel.
        'max_size_mb' => (int) env('LESSON_VIDEO_MAX_SIZE_MB', 1024),
        'part_size_mb' => (int) env('LESSON_VIDEO_PART_SIZE_MB', 8),
        // A felbehagyott (befejezetlen) feltoltes darabjait ennyi ora utan torli a takaritas.
        'upload_ttl_hours' => (int) env('LESSON_VIDEO_UPLOAD_TTL_HOURS', 24),
    ],

    /*
    |--------------------------------------------------------------------------
    | Felirat (WebVTT, #111)
    |--------------------------------------------------------------------------
    | Egyetlen kerelemben toltheto fel; a fajlnak WEBVTT-vel kell kezdodnie.
    */
    'captions' => [
        'max_size_kb' => (int) env('LESSON_CAPTIONS_MAX_SIZE_KB', 1024),
    ],
];
