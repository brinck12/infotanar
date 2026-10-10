<?php

declare(strict_types=1);

// Az admin attekinto szovegei: a naplozott muveletek cimkei.
// Az `actions` kulcsai az App\Enums\AuditAction ertekeit kovetik
// (`catalog.created` -> actions.catalog.created); uj esethez ide is kell cimke.
return [
    'actions' => [
        'account' => [
            'exported' => 'Fiókadatok exportálva',
            'deleted' => 'Fiók törölve',
            'password_changed' => 'Jelszó megváltoztatva',
            'email_changed' => 'E-mail-cím megváltoztatva',
        ],
        'catalog' => [
            'created' => 'Tananyag létrehozva',
            'updated' => 'Tananyag módosítva',
            'deleted' => 'Tananyag törölve',
            'reordered' => 'Tananyag átrendezve',
        ],
        'attachment' => [
            'uploaded' => 'Fájl feltöltve',
            'deleted' => 'Fájl törölve',
        ],
        'exam' => [
            'published' => 'Vizsga publikálva',
            'unpublished' => 'Vizsga elrejtve',
        ],
        'access' => [
            'granted' => 'Prémium hozzáférés kiadva',
            'revoked' => 'Prémium hozzáférés visszavonva',
        ],
        'subscription' => [
            'cancel_scheduled' => 'Előfizetés lemondva',
            'resumed' => 'Előfizetés folytatva',
        ],
        'invoice' => [
            'buyer_corrected' => 'Számla vevőadatai javítva',
            'retried' => 'Számlakiállítás újraindítva',
            'downloaded' => 'Számla letöltve',
        ],
        'user' => [
            'role_changed' => 'Szerepkör módosítva',
            'verification_resent' => 'Megerősítő levél újraküldve',
            'email_verified' => 'E-mail-cím kézzel megerősítve',
            'tokens_revoked' => 'Munkamenetek visszavonva',
            'password_reset_sent' => 'Jelszó-visszaállító levél elküldve',
        ],
    ],

    // Ha egy muveletnek meg nincs cimkeje, ez latszik a nyers kulcs helyett.
    'action_fallback' => 'Naplózott művelet',
];
