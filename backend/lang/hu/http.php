<?php

declare(strict_types=1);

return [
    'unauthenticated' => 'Ehhez be kell jelentkezned.',
    'forbidden' => 'Ehhez nincs jogosultságod.',
    'not_found' => 'A keresett erőforrás nem található.',
    'invalid_signature' => 'A link érvénytelen vagy lejárt.',
    'too_many_requests' => 'Túl sok kérés rövid idő alatt. Várj egy percet, és próbáld újra.',
    'throttled_wait' => 'Túl sok próbálkozás. Próbáld újra :time múlva.',
    'wait' => [
        'seconds' => ':count másodperc',
        'minutes' => ':count perc',
    ],
    'validation_failed' => 'A megadott adatok hibásak.',
    'server_error' => 'Váratlan hiba történt a szerveren.',
];
