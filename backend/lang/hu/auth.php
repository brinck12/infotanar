<?php

declare(strict_types=1);

return [
    'failed' => 'Hibás e-mail-cím vagy jelszó.',
    'throttle' => 'Túl sok próbálkozás, próbáld újra később.',

    'register' => [
        'accepted' => 'Elküldtük a további teendőket az e-mail-címedre. Nézd meg a leveleidet (a spam mappát is).',
        'exists_mail' => [
            'subject' => 'Már van fiókod az InfoTanáron',
            'greeting' => 'Szia :name!',
            'intro' => 'Valaki ezzel az e-mail-címmel próbált regisztrálni, de már van hozzá fiók.',
            'action' => 'Belépés',
            'forgot' => 'Ha elfelejtetted a jelszavad, a belépő oldalon kérhetsz új jelszót.',
            'outro' => 'Ha nem te voltál, nincs teendőd: a fiókodhoz senki nem fért hozzá.',
        ],
        'accept_terms' => 'A regisztrációhoz el kell fogadnod az Általános Szerződési Feltételeket és az Adatkezelési tájékoztatót.',
    ],

    'invite' => [
        'required' => 'A regisztrációhoz meghívókód kell.',
        'invalid' => 'Ez a meghívókód nem érvényes, lejárt, vagy már elfogyott.',
        'waitlist_joined' => 'Feliratkoztál a várólistára. Ha felvesszük a bétába, a megadott címen értesítünk.',
    ],

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

    'password_change' => [
        'done' => 'A jelszavad megváltozott. A többi eszközön kijelentkeztettünk.',
        'mail' => [
            'subject' => 'A jelszavad megváltozott',
            'greeting' => 'Szia :name!',
            'intro' => 'Az InfoTanár-fiókod jelszava éppen most megváltozott.',
            'outro' => 'Ha nem te voltál, azonnal kérj új jelszót a „Elfelejtett jelszó” oldalon, és írj nekünk.',
        ],
    ],

    'email_change' => [
        'requested' => 'Megerősítő levelet küldtünk az új címre. A csere a levélben lévő link megnyitásával lép életbe.',
        'confirmed' => 'Az e-mail-címed megváltozott.',
        'confirm_mail' => [
            'subject' => 'Erősítsd meg az új e-mail-címed',
            'greeting' => 'Szia :name!',
            'intro' => 'Ezt a címet adtad meg az InfoTanár-fiókod új e-mail-címeként. A csere a megerősítéssel lép életbe.',
            'action' => 'Új e-mail-cím megerősítése',
            'expiry' => 'A link :minutes percig érvényes.',
            'outro' => 'Ha nem te kérted, hagyd figyelmen kívül ezt a levelet: a fiók címe nem változik.',
        ],
        'notice_mail' => [
            'subject' => 'E-mail-cím cserét kértek a fiókodhoz',
            'greeting' => 'Szia :name!',
            'intro' => 'A fiókod e-mail-címének megváltoztatását kérték erre: :email. A csere csak akkor lép életbe, ha az új címre küldött linket megnyitják.',
            'outro' => 'Ha nem te voltál, azonnal változtasd meg a jelszavad: ezzel a többi eszközön lévő belépések megszűnnek.',
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
