<?php

declare(strict_types=1);

return [
    'video_missing' => 'Ehhez a leckéhez még nincs videó.',
    'needs_visible_test_case' => 'Publikált feladatnak legalább egy nyilvános tesztesettel kell rendelkeznie (enélkül a „Futtatás” nem működik). Előbb adj hozzá egyet, vagy rejtsd el a feladatot.',
    'upload_too_large' => 'A videó túl nagy (legfeljebb :max MB tölthető fel).',
    'upload_unsupported_type' => 'Ez a fájl nem videó: csak MP4 és WebM tölthető fel (a tartalmat vizsgáljuk, nem a kiterjesztést).',
    'upload_part_out_of_range' => 'A(z) :part. darab nincs a feltöltésben (1 és :total közötti lehet).',
    'upload_part_wrong_length' => 'A(z) :part. darab mérete hibás (:expected bájt kellene).',
    'upload_size_mismatch' => 'Az összeállított fájl mérete nem egyezik a megadottal (:size bájt): töltsd fel újra.',
    'upload_incomplete' => 'A feltöltés még nem teljes, hiányzó darabok: :missing.',
    'captions_invalid' => 'A felirat nem érvényes WebVTT: a fájlnak „WEBVTT”-vel kell kezdődnie.',
    'invalid_order' => 'A sorrendben a szülő összes elemének pontosan egyszer kell szerepelnie.',
    'delete_has_children' => 'Nem törölhető, mert vannak alá tartozó elemek. Előbb azokat töröld vagy helyezd át.',
    'delete_has_student_data' => 'Nem törölhető, mert diákok már dolgoztak vele (beadás vagy teljesítés). Rejtsd el helyette (publikálás kikapcsolása).',
];
