<?php

declare(strict_types=1);

return [
    // Feltoltesi hibak (UploadedFileInspector, ZipSafety); mind a `file` mezohoz tartozik.
    'unsupported_extension' => 'Ezt a fájltípust nem fogadjuk el (:ext). Elfogadott: :list.',
    'no_extension' => 'nincs kiterjesztés',
    'too_large' => 'A fájl túl nagy (:size MB). Legfeljebb :max MB lehet.',
    'macro_enabled' => 'A makrót tartalmazó fájlokat nem fogadjuk el. Mentsd el makró nélküli formátumban (.xlsx, .docx, .pptx).',
    'content_mismatch' => 'A fájl tartalma nem felel meg a kiterjesztésének (:ext). Mentsd el újra a programból, és azt a fájlt töltsd fel.',
    'unsafe_archive' => 'A fájl sérült, vagy a tömörített tartalma nem biztonságos. Mentsd el újra a programból, és azt a fájlt töltsd fel.',
    'empty_file' => 'A fájl üres. Válaszd ki újra a kész munkádat.',
    'upload_failed' => 'A feltöltés megszakadt. Próbáld újra.',
    'rejected_by_scanner' => 'A fájlt a víruskereső elutasította, ezért nem fogadjuk el.',

    // Az ertekelo nem tudta megnyitni a fajlt (UnreadableFile): a beadas `error` mezoje.
    'unreadable' => 'A fájl sérült, vagy nem a kért formátumban van.',

    // Ertekelolap-szerkeszto: a tipushoz nincs (meg) automatikus vizsgalat (RubricCheckCatalog).
    'check_unavailable' => 'Ezt a vizsgálatot még nem tudjuk automatikusan ellenőrizni. Válaszd a kézi ellenőrzést, vagy módosítsd a tulajdonságot.',

    // Csatolmanyok (ManageAttachment).
    'attachment_name_invalid' => 'A fájl neve csak ékezet nélküli betűt, számot, pontot, kötőjelet és aláhúzást tartalmazhat, legfeljebb 64 karakter hosszan. Nevezd át a fájlt.',
    'attachment_name_reserved' => 'A(z) :name nevet a kódfuttató használja. Adj más nevet a fájlnak.',
    'attachment_name_too_long' => 'A fájl neve túl hosszú. Legfeljebb 100 karakter lehet.',
    'attachment_extension_mismatch' => 'A megadott név kiterjesztése nem egyezik a feltöltött fájléval (:ext). Írd át a nevet, vagy hagyd üresen.',
    'attachment_limit_reached' => 'Ehhez legfeljebb :max fájl csatolható. Előbb törölj egyet.',
    'attachment_test_case_required' => 'Bemeneti fájlhoz ki kell választani a tesztesetet.',
    'attachment_test_case_not_allowed' => 'A teszteset nem ehhez a feladathoz tartozik, vagy ehhez a fájltípushoz nem adható meg.',
    'attachment_role_not_allowed' => 'Ilyen fájl ehhez a feladattípushoz nem csatolható.',
];
