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

    // Fajlbeadas (SubmitFileSolution, UploadFileSubmissionRequest).
    'not_a_file_task' => 'Ehhez a feladathoz nem tölthető fel fájl. Használd a szerkesztőt.',
    'file_required' => 'Válaszd ki a feltöltendő fájlt.',
    'too_large_for_request' => 'A fájl túl nagy. Legfeljebb :max KB lehet.',
    'evaluator_busy' => 'A fájlfeldolgozó most túlterhelt, próbáld újra egy perc múlva.',

    // Az ertekeles nem sikerult (a beadas `error` mezoje; a valasz 201 marad).
    'no_reader' => 'Ezt a fájltípust (:ext) még nem tudjuk automatikusan ellenőrizni.',
    'evaluation_timed_out' => 'A fájl ellenőrzése túl sokáig tartott. Egyszerűsítsd a fájlt, és töltsd fel újra.',

    // Az eredmeny pontjai (FileEvaluator).
    'group_other' => 'Egyéb',
    'found_not_checkable' => 'Ezt a pontot ebben a fájltípusban nem tudjuk ellenőrizni.',

    // Kezi pontok (SaveManualMarks, SaveManualMarksRequest); mind a `marks` mezohoz tartozik.
    'manual_marks_required' => 'Jelöld meg legalább egy kézi tételnél, hogy megvan-e.',
    'manual_mark_not_boolean' => 'A jelölés csak igaz vagy hamis lehet.',
    'manual_mark_not_manual' => 'Ez a tétel nem jelölhető kézzel.',
    'manual_mark_not_evaluated' => 'Ezt a beadást nem sikerült kiértékelni, ezért nincs mit megjelölni. Töltsd fel újra a fájlt.',
    'manual_mark_exam_open' => 'A jelölés a feladatsor beadása után lehetséges.',

    // Ertekelolap-proba (CheckRubric).
    'sample_solution_missing' => 'Ehhez a feladathoz nincs mintamegoldás feltöltve. Tölts fel egy fájlt a próbához, vagy csatold a mintamegoldást.',

    // Tablazatok: tenyek ("amit a fajlban talaltunk", SpreadsheetModel::facts).
    'fact_sheets' => 'Munkalapok',
    'fact_used_range' => 'Kitöltött terület',
    'fact_formulas' => 'Képletek száma',
    'fact_charts' => 'Diagramok',
    'fact_sheet_empty' => 'üres',
    'chart_type_column' => 'oszlopdiagram',
    'chart_type_bar' => 'sávdiagram',
    'chart_type_line' => 'vonaldiagram',
    'chart_type_scatter' => 'pontdiagram',
    'chart_type_pie' => 'kördiagram',
    'chart_type_area' => 'területdiagram',
    'chart_type_doughnut' => 'gyűrűdiagram',
    'chart_type_radar' => 'sugárdiagram',
    'chart_type_bubble' => 'buborékdiagram',
    'chart_type_other' => 'egyéb diagram',
    'chart_has' => 'van',
    'chart_has_not' => 'nincs',

    // Tablazatos vizsgalatok: szerkesztesi hibak (CheckHandler::validate).
    'sheet_address_invalid' => 'A cím nem érvényes. Példa: Munka1!B3 vagy B3:D9.',
    'sheet_address_single_cell' => 'Ehhez egyetlen cella címe kell, például Munka1!B3.',
    'sheet_range_too_large' => 'A tartomány túl nagy. Legfeljebb :max cellát vizsgálunk egyszerre.',
    'sheet_expected_required' => 'Add meg az elvárt értéket.',
    'formula_term_invalid' => 'Az elvárt érték nem érthető: :term. Használható: any, fn:SZUM, ref:$A$1, copied, nofixed, vesszővel elválasztva.',
    'sort_expected_invalid' => 'Az elvárt érték asc vagy desc legyen (utána ,num vagy ,text), több kulcsnál asc@1;desc@2. A tulajdonságban az oszlop @2 formában adható meg.',
    'sort_column_outside' => 'A rendezési oszlop kívül esik a megadott tartományon.',
    'chart_property_invalid' => 'A diagram tulajdonsága ezek egyike lehet: :list.',
    'chart_selector_invalid' => 'A diagram szűkítése [sheet=Munkalap] alakú lehet.',
    'chart_type_invalid' => 'A diagram típusa ezek egyike lehet: :list.',
    'chart_series_invalid' => 'Az adatsorok számát egész számmal vagy >=N alakban add meg.',
    'boolean_expected_invalid' => 'Az elvárt érték igen vagy nem lehet.',
    'print_area_property_invalid' => 'A tulajdonság a munkalap neve (üresen az első munkalap), cím nélkül.',
    'print_area_expected_invalid' => 'A nyomtatási terület tartomány legyen, például A1:F30.',
    'sheet_format_property_invalid' => 'A tulajdonság ezek egyike lehet: :list (például column_width[A]).',
    'sheet_format_selector_invalid' => 'A munkalap sorszáma szám legyen, például sheet_name[2].',
    'sheet_format_column_invalid' => 'Add meg az oszlopot szögletes zárójelben, például column_width[A].',
    'sheet_format_row_invalid' => 'Add meg a sor számát szögletes zárójelben, például row_height[3].',
    'length_expected_invalid' => 'A méretet számmal és mértékegységgel add meg (3cm, 15mm, 12pt), vagy csak számmal.',
    'cf_term_invalid' => 'A feltétel nem érthető: :term. Használható: rule:greater_than 50, fill:#FF0000, any.',
    'cf_rule_invalid' => 'Ismeretlen szabály. Használható: :list.',
    'cf_arguments_invalid' => 'A(z) :rule szabályhoz :count érték kell, szóközzel elválasztva.',
    'cf_fill_invalid' => 'A kitöltés színe #RRGGBB vagy magyar színnév (piros, zöld, kék...) legyen.',

    // Tablazatos vizsgalatok: amit a pontnal talaltunk (`found`).
    'found_no_cached_value' => 'a képlet eredménye nincs elmentve a fájlban',
    'found_constant' => 'nem képlet, hanem beírt érték: :value',
    'sort_ascending' => 'növekvő',
    'sort_descending' => 'csökkenő',
    'sort_ordered' => 'rendezett',
    'sort_unordered' => 'nincs rendezve',
    'cf_fill' => 'kitöltés',
    'cf_rule_greater_than' => 'nagyobb, mint',
    'cf_rule_less_than' => 'kisebb, mint',
    'cf_rule_greater_or_equal' => 'legalább',
    'cf_rule_less_or_equal' => 'legfeljebb',
    'cf_rule_equal' => 'egyenlő',
    'cf_rule_not_equal' => 'nem egyenlő',
    'cf_rule_between' => 'között',
    'cf_rule_not_between' => 'kívül',
    'cf_rule_contains_text' => 'szöveg tartalmazza',
    'cf_rule_begins_with' => 'ezzel kezdődik',
    'cf_rule_ends_with' => 'ezzel végződik',
    'cf_rule_top' => 'legnagyobb',
    'cf_rule_bottom' => 'legkisebb',
    'cf_rule_above_average' => 'átlag felett',
    'cf_rule_below_average' => 'átlag alatt',
    'cf_rule_duplicate' => 'ismétlődő',
    'cf_rule_unique' => 'egyedi',
    'cf_rule_formula' => 'képlet',
    'cf_rule_color_scale' => 'színskála',
    'cf_rule_data_bar' => 'adatsáv',
    'cf_rule_icon_set' => 'ikonkészlet',
    'cf_rule_other' => 'egyéb szabály',
];
