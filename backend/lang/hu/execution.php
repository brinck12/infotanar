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
    'error_status_label' => 'Hiba',
    // Kimenet-osszevetes (#155): a feladat leirasa alatt latszo szabalyok, es az elteres leirasa.
    'comparison' => [
        'tokens' => 'A szóközök és a sortörések számától eltekintünk: csak a kimenet elemeinek sorrendje számít.',
        'numeric' => 'A számokat :tolerance fogadjuk el (tizedesponttal és tizedesvesszővel is).',
        'numeric_exact' => 'A számokat az értékük szerint hasonlítjuk össze, tehát a 3,50 és a 3.5 ugyanaz.',
        'abs_tol' => ':tolerance pontossággal',
        'rel_tol' => 'legfeljebb :percent%-os relatív eltéréssel',
        'or' => ' vagy ',
        'ignore_blank_lines' => 'Az üres sorok számától eltekintünk.',
        'case_insensitive' => 'A kis- és nagybetűk közötti különbséget nem vesszük figyelembe.',
        'token_count' => 'A kimenet :actual elemből áll, de :expected elem az elvárt.',
        'token_differs' => ':position. elem: ezt kaptuk: „:actual”, ezt vártuk: „:expected”.',
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
