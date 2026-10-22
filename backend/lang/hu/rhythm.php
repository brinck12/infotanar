<?php

declare(strict_types=1);

return [
    'mail' => [
        'subject' => 'Ezen a héten ennyit haladtál',
        'greeting' => 'Szia :name!',
        'intro' => 'Jó látni, hogy tanultál: ezen a héten :days napon foglalkoztál az érettségi anyagával.',
        'lessons' => 'Befejezett leckék: :count.',
        'submissions' => 'Beadott megoldások: :count.',
        'action' => 'Folytatás',
        'unsubscribe' => 'Nem szeretnél több ilyen levelet? [Leiratkozom a heti összefoglalóról](:url). Bármikor visszakapcsolhatod a fiókodnál.',
    ],

    'unsubscribe' => [
        'done' => 'Nem küldünk több heti összefoglalót. Bármikor visszakapcsolhatod a fiókodnál.',
    ],

    'settings' => [
        'needs_verified_email' => 'A heti összefoglalóhoz előbb erősítsd meg az e-mail-címedet.',
    ],
];
