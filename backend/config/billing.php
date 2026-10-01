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

    /*
    |--------------------------------------------------------------------------
    | Havi elofizetes
    |--------------------------------------------------------------------------
    | Brutto ar forintban (az AFA-t a szamla bontja, #20).
    */
    'plan' => [
        'name' => env('BILLING_PLAN_NAME', 'InfoTanár Prémium – havi előfizetés'),
        'price_huf' => (int) env('BILLING_MONTHLY_PRICE_HUF', 2990),
        'period_months' => 1,
    ],

    /*
    |--------------------------------------------------------------------------
    | Barion (ADR 0001)
    |--------------------------------------------------------------------------
    | A POSKey titok: csak szerveroldalon hasznaljuk, soha nem kerul valaszba.
    */
    'barion' => [
        'environment' => env('BARION_ENVIRONMENT', 'test'),
        'base_urls' => [
            'test' => 'https://api.test.barion.com',
            'prod' => 'https://api.barion.com',
        ],
        // Csak helyi fejleszteshez/ellenorzeshez: a fenti helyett ide megy minden keres.
        'base_url_override' => env('BARION_BASE_URL'),
        'pos_key' => env('BARION_POS_KEY'),
        // A bolt Barion-fiokjanak e-mail cime (a tranzakcio kedvezmenyezettje).
        'payee' => env('BARION_PAYEE'),
        'timeout' => (int) env('BARION_TIMEOUT', 15),
    ],

    /*
    |--------------------------------------------------------------------------
    | Szamlazz.hu Szamla Agent (ADR 0002)
    |--------------------------------------------------------------------------
    | Minden sikeres terhelesrol pontosan egy szamla (#20). Az agent-kulcs titok.
    | Az AFA-kulcs szam (pl. 27) vagy adomentessegi kod (pl. AAM): a konyvelovel
    | egyeztetendo. A csomag ara brutto, a szamla ebbol bontja a nettot.
    */
    'szamlazz' => [
        'base_url' => env('SZAMLAZZ_BASE_URL', 'https://www.szamlazz.hu/szamla/'),
        'agent_key' => env('SZAMLAZZ_AGENT_KEY'),
        'vat_rate' => (string) env('SZAMLAZZ_VAT_RATE', '27'),
        'invoice_prefix' => env('SZAMLAZZ_INVOICE_PREFIX'),
        'timeout' => (int) env('SZAMLAZZ_TIMEOUT', 30),
        'disk' => env('SZAMLAZZ_INVOICE_DISK', 'invoices'),
    ],
];
