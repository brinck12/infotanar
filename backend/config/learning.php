<?php

declare(strict_types=1);

return [
    /*
    |--------------------------------------------------------------------------
    | Mintamegoldas feloldasa (#154)
    |--------------------------------------------------------------------------
    | A mintamegoldas elfogadott beadas utan automatikusan latszik. Elotte csak
    | akkor nyithato meg (kifejezett megerositessel), ha a diaknak legalabb ennyi
    | sikertelen beadasa van a feladatra.
    */
    'solution' => [
        'unlock_after_failed_submissions' => (int) env('SOLUTION_UNLOCK_AFTER_FAILED_SUBMISSIONS', 5),
    ],
];
