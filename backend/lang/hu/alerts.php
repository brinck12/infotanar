<?php

declare(strict_types=1);

return [
    'mail' => [
        'subject' => '[:app] Riasztás: :summary',
        'greeting' => 'Kézi beavatkozás kell',
        'environment' => 'Környezet: :environment',
    ],

    'job_failed' => ':job: a job az összes próbálkozás után is elbukott.',
    'invoice_rejected' => 'A Számlázz.hu véglegesen elutasított egy számlát; az admin felületen javítható és újraküldhető.',
    'stuck_billing' => 'Elakadt számlák vagy fizetések várnak beavatkozásra.',
];
