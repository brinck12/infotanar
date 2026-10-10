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
