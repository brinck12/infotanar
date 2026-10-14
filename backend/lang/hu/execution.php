<?php

declare(strict_types=1);

return [
    'no_visible_test_cases' => 'Ehhez a feladathoz nincs nyilvános teszteset, használd a Beadás gombot.',
    'language_not_allowed' => 'Ez a feladat nem oldható meg ezen a nyelven.',
    'not_a_code_task' => 'Ehhez a feladathoz nem tartozik futtatható kód.',
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
    'capacity_busy' => 'Most sokan futtatnak kódot. Próbáld újra pár másodperc múlva.',
    'files_unavailable' => 'A feladat adatfájljai most nem érhetők el. Próbáld újra később.',
    'error_status_label' => 'Hiba',
    // Elemenkenti (tokens, numeric) osszevetes: az elso elteres leirasa a lathato tesztesetnel.
    'comparison' => [
        'token_count' => 'A kimenet :actual elemből áll, de :expected elem az elvárt.',
        'token_differs' => 'A(z) :position. elem eltér: ezt kaptuk: „:actual”, ezt vártuk: „:expected”.',
    ],
    // Reszfeladatonkenti pontozas: a megjegyzes csak lathato teszteset hibajanal megy ki.
    'subtasks' => [
        'default_label' => ':number. feladat',
        'note' => 'Várt: :expected, kapott: :actual',
        'missing_section' => 'A kimenetben nincs „:number. feladat” fejléc, ezért ezt a részt nem tudtuk értékelni.',
        'empty' => '(üres)',
    ],
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
