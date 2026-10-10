<?php

declare(strict_types=1);

return [
    /*
    |--------------------------------------------------------------------------
    | Idozito
    |--------------------------------------------------------------------------
    | A hatarido egyetlen forrasa a szerver (exam_attempts.deadline_at); a
    | kliens visszaszamlaloja csak megjelenites. A hatarido utan ennyi
    | masodpercig meg fogadunk feltoltest, hogy az utolso pillanatban inditott
    | feltoltes es az oraelteres miatt ne vesszen el munka.
    */
    'grace_seconds' => (int) env('EXAMS_GRACE_SECONDS', 15),

    // Ennyi nap tetlenseg utan a nyitott gyakorlo probalkozast lezarjuk (vagy toroljuk, ha ures).
    'idle_days' => (int) env('EXAMS_IDLE_DAYS', 14),

    // A vizsga forrasfajljainak alairt URL-je eddig el (perc): egy vizsga orakig
    // tart, es az oldal az elso valaszt tartja meg.
    'file_url_ttl_minutes' => (int) env('EXAMS_FILE_URL_TTL_MINUTES', 360),

    // A lejart probalkozasokat lezaro job egy futasban ennyit dolgoz fel.
    'close_batch' => (int) env('EXAMS_CLOSE_BATCH', 20),

    // Vizsga inditasa, feltoltes, beadas: ennyi keres percenkent, fiokonkent.
    'rate' => [
        'write_per_minute' => (int) env('EXAMS_WRITE_PER_MINUTE', 30),
    ],
];
