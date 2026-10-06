<?php

declare(strict_types=1);

/*
|--------------------------------------------------------------------------
| CORS
|--------------------------------------------------------------------------
| Elesben a frontend es az API azonos originen fut (az nginx proxyzza az
| /api-t), ott ez nem jatszik szerepet. Fejlesztesnel a Vite szerver mas
| porton van: csak a felsorolt originek hivhatjak az API-t bongeszobol.
| A hitelesites Bearer tokennel megy, suti nincs, ezert credentials nem kell.
*/

$origins = (string) env('CORS_ALLOWED_ORIGINS', env('FRONTEND_URL', 'http://localhost:5173'));

return [
    'paths' => ['api/*'],

    'allowed_methods' => ['*'],

    'allowed_origins' => array_values(array_filter(array_map(
        static fn (string $origin): string => rtrim(trim($origin), '/'),
        explode(',', $origins),
    ))),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    // A kliens ebbol tudja, mennyit varjon egy 429 utan.
    'exposed_headers' => ['Retry-After'],

    'max_age' => 600,

    'supports_credentials' => false,
];
