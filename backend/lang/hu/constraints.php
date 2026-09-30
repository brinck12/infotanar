<?php

declare(strict_types=1);

return [
    'invalid_shape' => 'A szabályokat {"require": [...], "forbid": [...]} formában add meg.',
    'require' => [
        'for_loop' => 'for ciklust kell használnod',
        'while_loop' => 'while ciklust kell használnod',
        'loop' => 'ciklust kell használnod',
        'recursion' => 'rekurziót kell használnod (a függvény hívja önmagát)',
    ],
    'violation' => [
        'require' => 'Ennél a feladatnál :rule.',
        'forbid' => 'Ennél a feladatnál :rule.',
        'forbid_csharp' => 'Ennél a feladatnál nem használhatod ezt: :names – valósítsd meg a tételt saját ciklussal.',
        'dynamic' => 'Ennél a feladatnál reflexió és dynamic nem használható.',
    ],
    'forbid' => [
        'builtin' => 'a beépített :name() függvény nem használható',
        'method' => 'a .:name() metódus nem használható',
    ],
];
