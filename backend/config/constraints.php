<?php

declare(strict_types=1);

return [
    /*
    |--------------------------------------------------------------------------
    | Python statikus elemzo (#43)
    |--------------------------------------------------------------------------
    | A beadott kodot NEM futtatja: csak ast.parse-szal elemzi
    | (resources/python/constraint_analyzer.py), a Judge0-hoz fordulas elott.
    | Ha az elemzo nem erheto el, a szabalyokat kihagyjuk (naplozva), a
    | beadas nem akad el.
    */
    'python_binary' => env('CONSTRAINTS_PYTHON_BINARY', 'python3'),
    'timeout_seconds' => (int) env('CONSTRAINTS_ANALYZER_TIMEOUT', 5),

    /*
    |--------------------------------------------------------------------------
    | A feladat-szerkeszto (#49) ajanlott tiltasai
    |--------------------------------------------------------------------------
    | A tipikus erettsegi "rovidítesek"; a szerkeszto ezekbol kinal, de mas
    | nev is megadhato (a ConstraintSet barmely ervenyes azonositot elfogad).
    */
    'suggested_forbid' => [
        'builtin' => ['sum', 'max', 'min', 'sorted', 'len', 'any', 'all', 'filter', 'map', 'reversed'],
        'method' => ['count', 'sort', 'index', 'reverse'],
    ],
];
