<?php

declare(strict_types=1);

return [
    'provider_unavailable' => 'A fizetési szolgáltató jelenleg nem érhető el. Próbáld újra néhány perc múlva.',
    'provider_rejected' => 'A fizetést most nem sikerült elindítani. Próbáld újra később, vagy írj nekünk.',
    'already_subscribed' => 'Már van élő előfizetésed.',
    'email_not_verified' => 'Előfizetés előtt erősítsd meg az e-mail-címed.',
    'not_subscribed' => 'Nincs élő előfizetésed. Előfizetni az Előfizetés oldalon tudsz.',
    'already_canceling' => 'Az előfizetésed lemondása már be van állítva az időszak végére.',
    'not_canceling' => 'Az előfizetésed nincs lemondva, nincs mit visszavonni.',
    'invoice_not_ready' => 'Ehhez a fizetéshez még nem készült el a számla. Általában néhány percen belül megérkezik e-mailben is.',
    'invoice_unavailable' => 'A számla most nem tölthető le. Próbáld újra később; e-mailben is megkaptad.',
    'invoice_already_issued' => 'Ez a számla már elkészült; kiállított számlát nem lehet módosítani vagy újra kiállítani.',
    'billing_profile_missing' => 'Fizetés előtt add meg a számlázási adataidat.',

    // Az elofizetes eletciklusanak levelei (#137). Helyettesitok: :amount, :period_end, :grace_end.
    // Az `action` kulcs megleteben gomb is kerul a levelbe (az Elofizetes oldalra visz).
    'mail' => [
        'greeting' => 'Szia :name!',
        'started' => [
            'subject' => 'Elindult az előfizetésed',
            'lines' => [
                'Köszönjük! Az előfizetésed elindult, mostantól minden lecke és feladat elérhető.',
                'A díj havonta :amount. A következő megújítás napja: :period_end',
                'Az előfizetést bármikor lemondhatod a fiókodban; a lemondás az aktuális időszak végén lép életbe.',
                'A számlát külön e-mailben küldjük.',
            ],
            'action' => 'Előfizetés kezelése',
        ],
        'renewed' => [
            'subject' => 'Megújult az előfizetésed',
            'lines' => [
                'Sikeresen megújítottuk az előfizetésedet (:amount).',
                'Az új időszak vége: :period_end',
                'A számlát külön e-mailben küldjük.',
            ],
        ],
        'renewal_failed' => [
            'subject' => 'Nem sikerült megújítani az előfizetésed',
            'lines' => [
                'Az előfizetésed megújításakor a kártyád terhelése nem sikerült.',
                'A hozzáférésed eddig megmarad: :grace_end',
                'Ha addig új kártyával rendezed a fizetést, az előfizetésed megszakítás nélkül folytatódik.',
            ],
            'action' => 'Fizetés új kártyával',
        ],
        'renewal_reminder' => [
            'subject' => 'Hamarosan megújul az előfizetésed',
            'lines' => [
                'A megújítás napja: :period_end',
                'Ekkor :amount összeggel megterheljük a mentett kártyádat.',
                'Ha nem szeretnéd megújítani, addig lemondhatod a fiókodban.',
            ],
            'action' => 'Előfizetés kezelése',
        ],
        'cancel_scheduled' => [
            'subject' => 'Lemondtad az előfizetésed',
            'lines' => [
                'Rögzítettük a lemondást, a kártyádat többet nem terheljük.',
                'Eddig minden elérhető marad: :period_end',
                'Ha meggondoltad magad, a lemondást addig bármikor visszavonhatod.',
            ],
            'action' => 'Lemondás visszavonása',
        ],
        'cancel_undone' => [
            'subject' => 'Visszavontad a lemondást',
            'lines' => [
                'Az előfizetésed folytatódik.',
                'A következő megújítás napja: :period_end (:amount)',
            ],
        ],
        'ended' => [
            'subject' => 'Véget ért az előfizetésed',
            'lines' => [
                'Az előfizetésed lezárult, a prémium leckék mostantól nem érhetők el.',
                'Az ingyenes leckék és az eddigi haladásod megmaradnak, és bármikor újra előfizethetsz.',
            ],
            'action' => 'Újra előfizetek',
        ],
    ],

    'validation' => [
        'tax_number' => 'Érvénytelen adószám. Formátum: 12345678-1-12.',
        'accept_immediate_performance' => 'A fizetés indításához jelöld be, hogy kéred a szolgáltatás azonnali megkezdését.',
    ],
];
