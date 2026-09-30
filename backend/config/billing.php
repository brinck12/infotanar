<?php

declare(strict_types=1);

return [
    /*
    |--------------------------------------------------------------------------
    | Turelmi ido sikertelen megujitas utan
    |--------------------------------------------------------------------------
    | Ennyi napig marad meg a premium hozzaferes egy past_due elofizetesnel,
    | mielott az utemezett sweep (ExpireGracePeriods) lezarja.
    */
    'grace_period_days' => (int) env('BILLING_GRACE_PERIOD_DAYS', 7),
];
