<?php

declare(strict_types=1);

return [
    'failed' => 'Hibás e-mail-cím vagy jelszó.',
    'throttle' => 'Túl sok próbálkozás, próbáld újra később.',

    'verification' => [
        'verified' => 'Az e-mail-címed megerősítve.',
        'already_verified' => 'Az e-mail-címed már meg van erősítve.',
        'invalid_link' => 'Érvénytelen megerősítő link.',
        'resent' => 'Új megerősítő levelet küldtünk.',
        'mail' => [
            'subject' => 'Erősítsd meg az e-mail-címed',
            'greeting' => 'Szia :name!',
            'intro' => 'Kattints az alábbi gombra az e-mail-címed megerősítéséhez.',
            'action' => 'E-mail-cím megerősítése',
            'expiry' => 'A link :minutes percig érvényes.',
            'outro' => 'Ha nem te regisztráltál, hagyd figyelmen kívül ezt a levelet.',
        ],
    ],

    'password_reset' => [
        'link_sent' => 'Ha létezik fiók ezzel a címmel, elküldtük a visszaállító linket.',
        'done' => 'A jelszavad megváltozott, jelentkezz be újra.',
        'invalid_token' => 'A visszaállító link érvénytelen vagy lejárt.',
        'mail' => [
            'subject' => 'Jelszó visszaállítása',
            'greeting' => 'Szia :name!',
            'intro' => 'Jelszó-visszaállítást kértek a fiókodhoz.',
            'action' => 'Új jelszó beállítása',
            'expiry' => 'A link :minutes percig érvényes, és csak egyszer használható.',
            'outro' => 'Ha nem te kérted, hagyd figyelmen kívül ezt a levelet, a jelszavad nem változik.',
        ],
    ],
];
