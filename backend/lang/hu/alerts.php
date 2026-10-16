<?php

declare(strict_types=1);

return [
    'mail' => [
        'subject' => '[:app] Riasztás: :summary',
        'greeting' => 'Kézi beavatkozás kell',
        'environment' => 'Környezet: :environment',
    ],

    'digest' => [
        'subject' => '[:app] Böngészőhibák :day: :total db',
        'greeting' => 'Napi böngészőhiba-összegző',
        'summary' => ':day napon :total böngészőhiba érkezett; a leggyakoribbak:',
        'row' => ':count× :message (:url)',
    ],

    'server_error' => 'Kezeletlen szerverhiba: :class',
    'job_failed' => ':job: a job az összes próbálkozás után is elbukott.',
    'invoice_rejected' => 'A Számlázz.hu véglegesen elutasított egy számlát; az admin felületen javítható és újraküldhető.',
    'account_purge_failed' => ':listener: a fiók törlésekor a takarítás hibázott; a napi söprés újrapróbálja.',
    'stuck_billing' => 'Elakadt számlák vagy fizetések várnak beavatkozásra.',
];
