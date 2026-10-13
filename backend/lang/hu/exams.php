<?php

declare(strict_types=1);

// Gyakorlo vizsgak szovegei.
return [
    'mode_unavailable' => 'Ehhez a feladatsorhoz nincs vizsgahelyzet, válaszd a gyakorlást.',
    'attempt_closed' => 'A feladatsor már be van adva, a megoldások nem módosíthatók.',
    'part_not_uploadable' => 'Ezt a részt a beépített szerkesztőben oldod meg.',
    'result_not_ready' => 'Az eredmény még készül. Próbáld újra egy pillanat múlva.',
    'file_required' => 'Válaszd ki a feltöltendő fájlt.',
    'upload_failed' => 'A fájl feltöltése nem sikerült. Próbáld újra.',
    'too_large_for_request' => 'A fájl túl nagy.',
    'session_invalid' => 'A vizsgaidőszak alakja ÉÉÉÉ-05 vagy ÉÉÉÉ-10 legyen.',
    'mode_invalid' => 'Válaszd ki, hogy vizsgahelyzetben vagy gyakorlásként indítod.',

    'publish' => [
        'no_parts' => 'A vizsgának legalább egy részt tartalmaznia kell.',
        'rubric_incomplete' => 'A(z) :number. rész értékelőlapja hiányos.',
        'exercise_unpublished' => 'A(z) :number. rész feladata nincs publikálva.',
        'points_mismatch' => 'A részek pontjainak összege (:sum) nem egyezik a vizsga összpontszámával (:total).',
    ],

    'parts_locked' => 'Közzétett vizsgához nem adható új rész. Előbb vond vissza a közzétételt.',
    'parts_locked_remove' => 'Közzétett vizsgából nem törölhető rész. Előbb vond vissza a közzétételt.',
    'part_exercise_kind' => 'Ehhez a részhez csak szerkesztős vagy fájlfeltöltős feladat választható.',
    'attachment_role' => 'A vizsgához csak a forrásfájlok zipje csatolható.',

    'summary' => [
        'unreadable' => 'A feltöltött fájlt nem sikerült feldolgozni.',
        'no_file' => 'Ebben a részben nem adtál be fájlt.',
        'no_solution' => 'Nem adtál be megoldást ebben a részben.',
        'lost_group' => 'A legtöbb pont itt veszett el: :group (:lost pont).',
        'subtask_failed' => 'A(z) :number. részfeladat nem adott pontot: :label.',
        'tests_failed' => ':total teszteset közül :failed nem teljesült.',
    ],
];
