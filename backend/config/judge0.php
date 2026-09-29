<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Judge0 kapcsolat
    |--------------------------------------------------------------------------
    | A Judge0 peldany a szerveren csak localhoston erheto el. Lokalis
    | fejlesztesnel SSH-tunnellel kell eloallitani ugyanezt a cimet:
    |   ssh -L 2358:localhost:2358 <user>@<szerver>
    */
    'url' => rtrim((string) env('JUDGE0_URL', 'http://localhost:2358'), '/'),

    'auth_token' => env('JUDGE0_AUTH_TOKEN'),

    // A teljes HTTP kereste vonatkozo timeout masodpercben. Bovebben kell
    // legyen, mint a cpu_time_limit, kulonben sajat magunkat vagjuk el.
    'timeout' => (int) env('JUDGE0_TIMEOUT', 20),

    // Kapcsolodasi timeout: egy nem elerheto Judge0 azonnal hibat adjon,
    // ne a teljes 'timeout'-ot varjuk ki.
    'connect_timeout' => (int) env('JUDGE0_CONNECT_TIMEOUT', 3),

    // Egy futtatas/beadas osszes tesztesetere jutó felso korlat (mp). Kisebb
    // kell legyen, mint a frontend 60 mp-es keres-timeoutja, hogy a kliens
    // mindig ertelmes valaszt kapjon, ne vegtelen toltest.
    'evaluation_deadline' => (int) env('JUDGE0_EVALUATION_DEADLINE', 45),

    /*
    |--------------------------------------------------------------------------
    | Futtatasi limitek
    |--------------------------------------------------------------------------
    | Minden Judge0 keresben elkuldjuk. A memory_limit kilobyte-ban ertendo.
    */
    'limits' => [
        'cpu_time_limit' => (float) env('JUDGE0_CPU_TIME_LIMIT', 2),
        'memory_limit' => (int) env('JUDGE0_MEMORY_LIMIT', 128000),
        'max_processes_and_or_threads' => (int) env('JUDGE0_MAX_PROCESSES', 60),
    ],

    /*
    |--------------------------------------------------------------------------
    | Tamogatott nyelvek
    |--------------------------------------------------------------------------
    | A kulcs az, amit a frontend es az adatbazis hasznal (tasks.allowed_languages).
    | A 'match' egy kis- es nagybetu-erzeketlen reszlet, amivel a Judge0
    | /languages valaszaban megkeressuk a tenyleges ID-t futasidoben.
    | A 'fallback_id' csak akkor jon szoba, ha a /languages nem elerheto.
    */
    'languages' => [
        'python' => [
            'label' => 'Python 3',
            'match' => 'python (3',
            'fallback_id' => 71,
            'monaco' => 'python',
        ],
        'csharp' => [
            'label' => 'C#',
            'match' => 'c# (mono',
            'fallback_id' => 51,
            'monaco' => 'csharp',
        ],
        // Adatbazis-track. Amig az SQL-specifikus kiertekeles (#40) nincs kesz,
        // a Judge0 SQLite futtatokornyezete fut, stdout-osszevetessel.
        'sql' => [
            'label' => 'SQL',
            'match' => 'sql (sqlite',
            'fallback_id' => 82,
            'monaco' => 'sql',
        ],
    ],

    // Meddig tartsuk cache-ben a /languages valaszt (masodperc).
    'languages_cache_ttl' => (int) env('JUDGE0_LANGUAGES_CACHE_TTL', 3600),
];
