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

    'validation' => [
        'tax_number' => 'Érvénytelen adószám. Formátum: 12345678-1-12.',
        'accept_immediate_performance' => 'A fizetés indításához jelöld be, hogy kéred a szolgáltatás azonnali megkezdését.',
    ],
];
