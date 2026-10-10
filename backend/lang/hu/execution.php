<?php

declare(strict_types=1);

return [
    'no_visible_test_cases' => 'Ehhez a feladathoz nincs nyilvános teszteset, használd a Beadás gombot.',
    'language_not_allowed' => 'Ez a feladat nem oldható meg ezen a nyelven.',
    'unsupported_language' => 'Nem támogatott programozási nyelv: :language.',
    'judge0' => [
        'http_error' => 'A kódfuttató szolgáltatás hibával válaszolt (HTTP :status).',
        'malformed_response' => 'A kódfuttató szolgáltatás értelmezhetetlen választ adott.',
        'unreachable' => 'A kódfuttató szolgáltatás jelenleg nem elérhető, próbáld újra később.',
        'timed_out' => 'A kódfuttató szolgáltatás nem válaszolt időben. Próbáld újra később.',
    ],
    'rate_limited' => 'Túl sok futtatás rövid idő alatt. Próbáld újra :seconds másodperc múlva.',
    'daily_limit' => 'Elérted a napi futtatási keretet. Legkésőbb 24 óra múlva újra futtathatsz.',
    'busy' => 'A kódfuttató most túlterhelt. Próbáld újra :seconds másodperc múlva.',
    'error_status_label' => 'Hiba',
    'sql_dot_command' => 'A megoldás csak SQL utasításokat tartalmazhat (ponttal kezdődő sqlite-parancsokat nem).',
    'verdicts' => [
        'accepted' => 'Elfogadva',
        'wrong_answer' => 'Hibás kimenet',
        'time_limit_exceeded' => 'Időkorlát túllépve',
        'compilation_error' => 'Fordítási / szintaktikai hiba',
        'runtime_error' => 'Futásidejű hiba',
        'system_error' => 'Rendszerhiba',
        'constraint_violation' => 'Szabálysértés',
    ],
];
