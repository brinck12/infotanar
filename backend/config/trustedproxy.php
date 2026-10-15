<?php

declare(strict_types=1);

// A Laravel TrustProxies middleware-e ezt olvassa (config('trustedproxy.proxies')).
// TRUSTED_PROXIES: "*" (minden kozvetlen kapcsolat megbizott) vagy vesszovel elvalasztott IP/CIDR lista.
// Ures: nincs megbizott proxy (kozvetlen kapcsolat), az X-Forwarded-For figyelmen kivul marad.
$proxies = env('TRUSTED_PROXIES');

return [
    'proxies' => is_string($proxies) && $proxies !== ''
        ? ($proxies === '*' ? '*' : array_values(array_filter(array_map('trim', explode(',', $proxies)))))
        : null,
];
