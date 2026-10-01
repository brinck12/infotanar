<?php

declare(strict_types=1);

return [
    /*
    |--------------------------------------------------------------------------
    | Jogi dokumentumok a frontenden (#132)
    |--------------------------------------------------------------------------
    | A levelek lablece ezekre hivatkozik. Az utvonalak a frontend
    | `features/legal/documents.ts` fajljaval egyeznek; a cim ele a
    | FRONTEND_URL kerul.
    */
    'pages' => [
        'ÁSZF' => '/aszf',
        'Adatkezelés' => '/adatkezeles',
        'Impresszum' => '/impresszum',
    ],
];
