<?php

declare(strict_types=1);

/*
| Altalanos szabalyuzenetek "A(z) :attribute" formaban, mert a nevelo a
| szo kezdobetujetol fugg. A gyakori mezokre a "custom" blokk ad
| termeszetes, nevelos megfogalmazast.
*/

return [
    'array' => 'A(z) :attribute mezőnek tömbnek kell lennie.',
    'boolean' => 'A(z) :attribute mező értéke csak igaz vagy hamis lehet.',
    'confirmed' => 'A(z) :attribute megerősítése nem egyezik.',
    'current_password' => 'A megadott jelszó helytelen.',
    'date' => 'A(z) :attribute nem érvényes dátum.',
    'email' => 'A(z) :attribute nem érvényes e-mail-cím.',
    'ends_with' => 'A(z) :attribute a következők egyikére végződjön: :values.',
    'exists' => 'A kiválasztott :attribute nem létezik.',
    'in' => 'A kiválasztott :attribute érvénytelen.',
    'integer' => 'A(z) :attribute értékének egész számnak kell lennie.',
    'json' => 'A(z) :attribute érvényes JSON legyen.',
    'max' => [
        'array' => 'A(z) :attribute legfeljebb :max elemet tartalmazhat.',
        'numeric' => 'A(z) :attribute legfeljebb :max lehet.',
        'string' => 'A(z) :attribute legfeljebb :max karakter lehet.',
    ],
    'min' => [
        'array' => 'A(z) :attribute legalább :min elemet tartalmazzon.',
        'numeric' => 'A(z) :attribute legalább :min legyen.',
        'string' => 'A(z) :attribute legalább :min karakter legyen.',
    ],
    'numeric' => 'A(z) :attribute értékének számnak kell lennie.',
    'password' => [
        'letters' => 'A(z) :attribute tartalmazzon legalább egy betűt.',
        'mixed' => 'A(z) :attribute tartalmazzon kis- és nagybetűt is.',
        'numbers' => 'A(z) :attribute tartalmazzon legalább egy számot.',
        'symbols' => 'A(z) :attribute tartalmazzon legalább egy speciális karaktert.',
        'uncompromised' => 'Ez a jelszó szerepelt egy adatszivárgásban, válassz másikat.',
    ],
    'regex' => 'A(z) :attribute formátuma érvénytelen.',
    'required' => 'A(z) :attribute megadása kötelező.',
    'string' => 'A(z) :attribute szöveg legyen.',
    'unique' => 'Ez a(z) :attribute már foglalt.',
    'url' => 'A(z) :attribute nem érvényes URL.',

    'custom' => [
        'name' => [
            'required' => 'A név megadása kötelező.',
            'max' => 'A név legfeljebb :max karakter lehet.',
        ],
        'email' => [
            'required' => 'Az e-mail-cím megadása kötelező.',
            'email' => 'Érvénytelen e-mail-cím.',
            'max' => 'Az e-mail-cím legfeljebb :max karakter lehet.',
            'unique' => 'Ezzel az e-mail-címmel már regisztráltak.',
        ],
        'password' => [
            'required' => 'A jelszó megadása kötelező.',
            'confirmed' => 'A két jelszó nem egyezik.',
            'min' => 'A jelszó legalább :min karakter legyen.',
            'letters' => 'A jelszónak tartalmaznia kell legalább egy betűt.',
            'numbers' => 'A jelszónak tartalmaznia kell legalább egy számot.',
        ],
        'token' => [
            'required' => 'Hiányzik a visszaállító kód.',
        ],
        'task_id' => [
            'required' => 'A feladat azonosítója kötelező.',
            'exists' => 'A megadott feladat nem létezik.',
        ],
        'language' => [
            'required' => 'A programozási nyelv megadása kötelező.',
            'in' => 'Ez a programozási nyelv nem támogatott.',
        ],
        'source_code' => [
            'required' => 'A forráskód nem lehet üres.',
            'max' => 'A forráskód túl hosszú (legfeljebb :max karakter).',
        ],
        'postal_code' => [
            'regex' => 'Az irányítószám négy számjegy legyen (pl. 1051).',
        ],
        'tax_number' => [
            'required_if' => 'Cég vagy vállalkozó esetén az adószám megadása kötelező.',
            'prohibited_if' => 'Magánszemélyként nem adható meg adószám.',
        ],
    ],

    'attributes' => [
        'name' => 'név',
        'email' => 'e-mail-cím',
        'password' => 'jelszó',
        'password_confirmation' => 'jelszó megerősítése',
        'token' => 'visszaállító kód',
        'device_name' => 'eszköz neve',
        'task_id' => 'feladat',
        'language' => 'programozási nyelv',
        'source_code' => 'forráskód',
        'topic' => 'témakör',
        'level' => 'szint',
        'slug' => 'URL-azonosító',
        'title' => 'cím',
        'description' => 'leírás',
        'content' => 'tananyag',
        'video_path' => 'videó elérési útja',
        'captions_path' => 'felirat elérési útja',
        'is_free' => 'ingyenes',
        'is_published' => 'publikált',
        'track_id' => 'képzési ág',
        'module_id' => 'modul',
        'lesson_id' => 'lecke',
        'difficulty' => 'nehézség',
        'allowed_languages' => 'engedélyezett nyelvek',
        'starter_code' => 'kiinduló kód',
        'constraints' => 'kódszabályok',
        'sql_order_sensitive' => 'sorrendérzékenység',
        'comparison' => 'összevetés',
        'comparison.mode' => 'összevetési mód',
        'comparison.abs_tol' => 'abszolút tűrés',
        'comparison.rel_tol' => 'relatív tűrés',
        'comparison.case_insensitive' => 'kis- és nagybetű közti különbség figyelmen kívül hagyása',
        'comparison.ignore_blank_lines' => 'üres sorok figyelmen kívül hagyása',
        'expected' => 'elvárt kimenet',
        'actual' => 'kapott kimenet',
        'ids' => 'sorrend',
        'customer_type' => 'vevő típusa',
        'postal_code' => 'irányítószám',
        'city' => 'település',
        'address_line' => 'cím',
        'tax_number' => 'adószám',
        'reason' => 'indoklás',
        'ends_at' => 'lejárat',
    ],
];
