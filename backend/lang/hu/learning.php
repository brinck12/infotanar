<?php

declare(strict_types=1);

// Tanulasi celok es szobeli gyakorlas szovegei.
return [
    // A validacios uzenetek mezonevei (a kozos nevek a validation.php-ben vannak).
    'attributes' => [
        'exam_period' => 'vizsgaidőszak',
        'weekly_hours' => 'heti óraszám',
        'checked' => 'kipipált vázlatpontok listája',
        'checked_item' => 'vázlatpont sorszáma',
        'notes' => 'jegyzet',
        'scores' => 'önértékelés',
        'score' => 'önértékelés pontszáma',
    ],

    'validation' => [
        'present' => 'A(z) :attribute mező hiányzik a kérésből.',
        'checked_list' => 'A kipipált vázlatpontokat sorszámok listájaként kell elküldeni.',
        'checked_distinct' => 'Egy vázlatpont csak egyszer szerepelhet a kipipáltak között.',
        'unknown_criterion' => 'Az önértékelésben ismeretlen szempont szerepel: :criterion.',
    ],
];
