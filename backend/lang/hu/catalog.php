<?php

declare(strict_types=1);

return [
    'video_missing' => 'Ehhez a leckéhez még nincs videó.',
    'lesson_has_exercises' => 'Ez a lecke a feladatai megoldásával teljesíthető.',
    'needs_visible_test_case' => 'Publikált feladatnak legalább egy nyilvános tesztesettel kell rendelkeznie (enélkül a „Futtatás” nem működik). Előbb adj hozzá egyet, vagy rejtsd el a feladatot.',
    'needs_rubric' => 'Publikált fájlfeladatnak legalább egy értékelési pont kell.',
    'needs_spec' => 'Publikált feladatnak ki kell töltenie a típusának megfelelő adatokat.',
    'invalid_order' => 'A sorrendben a szülő összes elemének pontosan egyszer kell szerepelnie.',
    'delete_has_children' => 'Nem törölhető, mert vannak alá tartozó elemek. Előbb azokat töröld vagy helyezd át.',
    'delete_has_student_data' => 'Nem törölhető, mert diákok már dolgoztak vele (beadás vagy teljesítés). Rejtsd el helyette (publikálás kikapcsolása).',
    'delete_used_by_exam' => 'Nem törölhető, mert egy vizsga része. Előbb vedd ki a vizsgából, vagy rejtsd el (publikálás kikapcsolása).',

    // A feladat tipusa (kind) es a hozza kotott mezok (ExerciseRequest, UpdateExercise).
    'kind_locked' => 'A feladat típusa már nem módosítható, mert diákok dolgoztak vele.',
    'kind_used_by_exam' => 'A feladat típusa nem módosítható, mert a feladat egy vizsga része. Előbb vedd ki a vizsgából.',
    'kind_has_attachments' => 'A feladat típusa nem módosítható, amíg fájlok vannak hozzá csatolva. Előbb töröld a csatolt fájlokat.',
    'languages_not_allowed' => 'Ehhez a feladattípushoz nem tartozik programozási nyelv. Hagyd üresen a nyelvek listáját.',
    'sql_languages' => 'SQL feladatnál az egyetlen választható nyelv az SQL.',
    'comparison_only_code' => 'A kimenet összehasonlításának módja csak programozási feladatnál állítható be.',

    // A tipusfuggo adatok (spec) hibai (Services/Catalog/Spec).
    'spec' => [
        'unknown_key' => 'Ismeretlen mező: :keys.',
        'too_large' => 'A feladat adatai túl nagyok (legfeljebb :max KB). Rövidítsd a szövegeket vagy a kiinduló fájlokat.',
        'web_language_mismatch' => 'A(z) :name fájl nyelve nem egyezik a kiterjesztésével.',
        'web_needs_html' => 'Legalább egy HTML fájl kell: az első HTML fájl az előnézet.',
        'web_unknown_file' => 'A(z) :file nem szerepel a feladat HTML fájljai között.',
        'cell_invalid' => 'A(z) :cell nem érvényes cellacím. Nagybetűs oszlop és sorszám kell, például A1.',
        'cell_outside' => 'A(z) :cell cella kívül esik a táblázaton (:columns oszlop, :rows sor).',
        'range_not_column' => 'A kitöltendő tartomány egyetlen oszlopban, felülről lefelé haladjon, például C2:C10.',
        'paragraph_missing' => 'Nincs :index. indexű bekezdés: a feladatnak :count bekezdése van, a számozás 0-tól indul.',
    ],

    // Az alap validacios uzenetek kozul hianyzok (ExerciseRequest::messages).
    'validation' => [
        'enum' => 'A kiválasztott :attribute érvénytelen.',
        'list' => 'A(z) :attribute mező elemeit listaként kell megadni.',
        'distinct' => 'A(z) :attribute mezőben ismétlődő érték szerepel.',
        'required_with' => 'A(z) :attribute mező megadása kötelező.',
    ],

    // Mezonevek a hibauzenetekben (ExerciseRequest::attributes).
    'attributes' => [
        'kind' => 'feladattípus',
        'spec' => 'feladat adatai',
        'comparison' => 'összehasonlítás módja',
        'comparison.mode' => 'összehasonlítás módja',
    ],
];
