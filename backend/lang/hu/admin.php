<?php

declare(strict_types=1);

return [
    // Naplo-nezet (#161). A kulcsok az AuditAction ertekei (pont = beagyazas).
    'audit' => [
        'actions' => [
            'account' => ['exported' => 'Fiókadatok exportálása', 'deleted' => 'Fiók törlése'],
            'catalog' => [
                'created' => 'Tananyag létrehozása',
                'updated' => 'Tananyag módosítása',
                'deleted' => 'Tananyag törlése',
                'reordered' => 'Tananyag átrendezése',
            ],
            'access' => ['granted' => 'Prémium hozzáférés adása', 'revoked' => 'Prémium hozzáférés visszavonása'],
            'subscription' => ['cancel_scheduled' => 'Előfizetés lemondása', 'resumed' => 'Előfizetés visszavonása (folytatás)'],
            'invoice' => ['buyer_corrected' => 'Számla vevőadatának javítása', 'retried' => 'Számla újrapróbálása'],
        ],
        'subjects' => [
            'user' => 'Felhasználó',
            'track' => 'Képzési ág',
            'module' => 'Modul',
            'lesson' => 'Lecke',
            'exercise' => 'Feladat',
            'test_case' => 'Teszteset',
            'subscription' => 'Előfizetés',
            'invoice' => 'Számla',
        ],
        'system_actor' => 'Rendszer',
        'deleted_actor' => 'törölt felhasználó',
        'deleted_subject' => 'törölt',
    ],

    'starter_code_language' => 'Kiinduló kód csak engedélyezett nyelvre adható meg („:language” nincs az engedélyezettek között).',
];
