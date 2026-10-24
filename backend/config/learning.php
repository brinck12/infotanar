<?php

declare(strict_types=1);

return [
    /*
    |--------------------------------------------------------------------------
    | Tanulasi celok (users.preferences)
    |--------------------------------------------------------------------------
    | A frontend valasztolistainak tukre (shared/domain/preferences.ts): ha ott
    | valtozik, itt is valtoztatni kell. A vizsgaidoszakok idovel cserelodnek,
    | ezert konfiguracio, nem kod.
    */
    'exam_periods' => ['2027-05', '2027-10', '2028-05'],

    'weekly_hours' => ['1-2', '3-4', '5+'],

    /*
    |--------------------------------------------------------------------------
    | Heti ritmus
    |--------------------------------------------------------------------------
    | A napok hatara ebben az idozonaban van (a tarolas UTC). A cel (aktiv napok szama
    | hetente) a `weekly_hours` ertekeibol jon: a kulcsoknak egyezniuk kell vele.
    | A cel el nem erese sehol nem latszik, csak az elerese.
    */
    'timezone' => 'Europe/Budapest',

    'weekly_goal_days' => ['1-2' => 2, '3-4' => 3, '5+' => 4],

    'languages' => ['python', 'csharp'],

    /*
    |--------------------------------------------------------------------------
    | Szobeli gyakorlas (oral_practices)
    |--------------------------------------------------------------------------
    | A temakorok tartalma (vazlat, B feladat, megoldas) a frontendben van
    | (features/oral/topics.ts); a szerver csak a slugokat es az onertekeles
    | szempontjait ismeri, ezek alapjan fogadja el a mentest.
    */
    'oral_topics' => [
        'szovegszerkesztes',
        'grafika-es-kepszerkesztes',
        'bemutatokeszites',
        'publikalas-a-vilaghalon',
        'tablazatkezeles',
        'adatbazis-kezeles',
    ],

    // Pontosan a frontend ORAL_SCORING `selfAssessed` szempontjai; mindegyik 0..4 pont.
    'oral_self_criteria' => [
        'Logikai felépítés',
        'Kifejezőkészség, szaknyelv',
        'Kommunikatív készség',
    ],
];
