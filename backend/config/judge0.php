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

    // A Judge0 fele meno HTTP keresek alap-timeoutja masodpercben (pl. /languages).
    // Futtatasnal a SolutionEvaluator tesztesetenkent sajat idokeretet ad meg.
    'timeout' => (int) env('JUDGE0_TIMEOUT', 20),

    // Kapcsolodasi timeout: egy nem elerheto Judge0 azonnal hibat adjon,
    // ne a teljes 'timeout'-ot varjuk ki.
    'connect_timeout' => (int) env('JUDGE0_CONNECT_TIMEOUT', 3),

    // Egy futtatas/beadas osszes tesztesetere jutó felso korlat (mp). Kisebb
    // kell legyen, mint a frontend 60 mp-es keres-timeoutja, hogy a kliens
    // mindig ertelmes valaszt kapjon, ne vegtelen toltest.
    'evaluation_deadline' => (int) env('JUDGE0_EVALUATION_DEADLINE', 45),

    // Tesztesetenkent a futas faliora-korlatjan felul ennyi ido (mp) jut a sorban
    // allasra es a forditasra. A kiertekeles idokerete: tesztesetek szama x
    // (faliora-korlat + ez), de legfeljebb az 'evaluation_deadline'.
    'test_overhead' => (int) env('JUDGE0_TEST_OVERHEAD', 10),

    /*
    |--------------------------------------------------------------------------
    | Futtatasi limitek
    |--------------------------------------------------------------------------
    | Minden Judge0 keresben elkuldjuk. Az idok masodpercben, a memoria
    | kilobyte-ban ertendo. A 'cpu_time_limit' es a 'memory_limit' az alapertek:
    | egy feladat feluldefinialhatja (exercises.time_limit_ms, memory_limit_kb),
    | lasd ExecutionLimitResolver.
    */
    'limits' => [
        'cpu_time_limit' => (float) env('JUDGE0_CPU_TIME_LIMIT', 2),
        'memory_limit' => (int) env('JUDGE0_MEMORY_LIMIT', 128000),
        'max_processes_and_or_threads' => (int) env('JUDGE0_MAX_PROCESSES', 60),

        // Faliora-korlat = processzorido-korlat + ennyi. Az alap 2 mp-nel ez 10 mp,
        // ami a Judge0 gyari faliora-korlatja.
        'wall_time_margin' => (float) env('JUDGE0_WALL_TIME_MARGIN', 8),

        // Felso hatarok: nem lehetnek nagyobbak, mint a Judge0 peldany sajat
        // MAX_CPU_TIME_LIMIT, MAX_WALL_TIME_LIMIT es MAX_MEMORY_LIMIT beallitasa,
        // kulonben a Judge0 a kerest elutasitja. Az alapertekek a Judge0 gyari ertekei.
        'max_cpu_time_limit' => (float) env('JUDGE0_MAX_CPU_TIME_LIMIT', 15),
        'max_wall_time_limit' => (float) env('JUDGE0_MAX_WALL_TIME_LIMIT', 20),
        'max_memory_limit' => (int) env('JUDGE0_MAX_MEMORY_LIMIT', 512000),
    ],

    /*
    |--------------------------------------------------------------------------
    | Nyelvenkenti idoszorzo
    |--------------------------------------------------------------------------
    | A processzorido-korlatot ennyivel szorozzuk az adott nyelvnel (a feladat
    | sajat korlatjat is). Pl. a C# (Mono) lassabban indul, mint a Python: ha a
    | diakok helyes C# megoldasai idotullepest kapnak, itt emelheto.
    */
    'language_time_factor' => [
        'python' => (float) env('JUDGE0_TIME_FACTOR_PYTHON', 1),
        'csharp' => (float) env('JUDGE0_TIME_FACTOR_CSHARP', 1),
        'sql' => (float) env('JUDGE0_TIME_FACTOR_SQL', 1),
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
        // Adatbazis-track: a Judge0 SQLite (sqlite3 CLI) sandboxaban fut, a
        // teszteset bemenete az adatkeszlet-szkript, az eredmenyt CSV-kent
        // vetjuk ossze (SqlProgram, SqlResultComparator).
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
