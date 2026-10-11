<?php

declare(strict_types=1);

// A dokumentum-vizsgálatok (docx, odt) szövegei: találatok és szerkesztési hibák.
return [
    'yes' => 'igen',
    'no' => 'nem',
    'portrait' => 'álló',
    'landscape' => 'fekvő',
    'line_multiple' => ':value-szoros',
    'line_fixed' => [
        'exact' => ':value pt (pontosan)',
        'atleast' => ':value pt (legalább)',
    ],

    // Amit a fájlban találtunk (FileSubmission.facts).
    'fact_page' => 'Lapméret',
    'fact_margins' => 'Margók',
    'margins_value' => 'felül :top, alul :bottom, balra :left, jobbra :right',
    'fact_font' => 'Alapbetű',
    'fact_columns' => 'Oszlopok száma',
    'fact_tables' => 'Táblázatok száma',
    'fact_images' => 'Képek',
    'fact_styles' => 'Használt stílusok',

    // Szerkesztési hibák (az értékelőlap-szerkesztő property/expected mezője alatt).
    'error' => [
        'property_shape' => 'A tulajdonság neve betűvel kezdődjön, utána legfeljebb egy szögletes zárójeles szelektor állhat, pl. font_size[heading=1].',
        'property_unknown' => 'Ismeretlen tulajdonság: :property. Használható: :allowed.',
        'selector_required' => 'Ehhez a tulajdonsághoz szelektor kell. Használható: :allowed.',
        'selector_not_allowed' => 'A(z) :property tulajdonsághoz nem adható meg szelektor.',
        'selector_invalid' => 'A(z) [:selector] szelektor nem érvényes. Használható: :allowed (pl. paragraph=2, style=Címsor 1).',
        'expected_length' => 'Az elvárt érték hosszúság legyen, mértékegységgel (cm, mm, pt, in), pl. 2,5 cm.',
        'expected_boolean' => 'Az elvárt érték igen vagy nem legyen.',
        'expected_count' => 'Az elvárt érték pozitív egész szám legyen.',
        'expected_text' => 'Az elvárt érték ne legyen üres.',
        'expected_size' => 'Az elvárt betűméret pozitív szám legyen pontban, pl. 12 vagy 12 pt.',
        'expected_color' => 'Az elvárt szín #RRGGBB alakú legyen, vagy a piros, zöld, kék, fekete, fehér, sárga, narancs, szürke valamelyike.',
        'expected_page_size' => 'Az elvárt lapméret A3, A4, A5, B4, B5, Letter vagy Legal legyen.',
        'expected_orientation' => 'Az elvárt tájolás álló vagy fekvő legyen.',
        'expected_alignment' => 'Az elvárt igazítás balra, középre, jobbra vagy sorkizárt legyen.',
        'expected_line_spacing' => 'Az elvárt sorköz szorzó legyen (pl. 1,5), egyszeres, másfeles, dupla, vagy mértékegységes hossz (pl. 18 pt).',
        'expected_style' => 'Az elvárt érték a stílus neve legyen, pl. Címsor 1.',
        'expected_shading' => 'Az elvárt érték igen, nem vagy egy szín legyen (pl. #D9D9D9).',
        'expected_table_alignment' => 'Az elvárt táblázat-igazítás balra, középre vagy jobbra legyen.',
        'expected_ratio' => 'Az elvárt oldalarány pozitív szám legyen (szélesség/magasság, pl. 1,5), vagy 4:3 alakú.',
        'expected_wrap' => 'Az elvárt körbefuttatás: sorban, négyzetes, szorosan, átfutó, fent és lent, szöveg mögött vagy szöveg előtt.',
        'expected_break' => 'Az elvárt érték igen, nem, oldal, folyamatos, páros vagy páratlan legyen.',
        'expected_tab_type' => 'Az elvárt tabulátortípus balra, középre, jobbra vagy tizedes legyen.',
        'expected_leader' => 'Az elvárt kitöltés pont, kötőjel, aláhúzás vagy nincs legyen.',
        'expected_list_type' => 'Az elvárt listatípus felsorolás (bullet) vagy számozás (number) legyen.',
    ],

    // A belső kulcsok magyar neve a "ezt találtuk" szövegekhez.
    'words' => [
        'alignment' => ['left' => 'balra', 'center' => 'középre', 'right' => 'jobbra', 'justify' => 'sorkizárt'],
        'orientation' => ['portrait' => 'álló', 'landscape' => 'fekvő'],
        'wrap' => [
            'inline' => 'sorban', 'square' => 'négyzetes', 'tight' => 'szorosan', 'through' => 'átfutó',
            'topbottom' => 'fent és lent', 'behind' => 'szöveg mögött', 'front' => 'szöveg előtt', 'none' => 'nincs',
        ],
        'tab_type' => ['left' => 'balra', 'center' => 'középre', 'right' => 'jobbra', 'decimal' => 'tizedes', 'bar' => 'függőleges vonal', 'clear' => 'törölt'],
        'leader' => ['none' => 'nincs', 'dot' => 'pont', 'hyphen' => 'kötőjel', 'underscore' => 'aláhúzás', 'middledot' => 'középpont'],
        'list_type' => ['bullet' => 'felsorolás', 'number' => 'számozás'],
        'break' => ['page' => 'új oldalon', 'continuous' => 'folyamatos', 'even' => 'páros oldalon', 'odd' => 'páratlan oldalon', 'column' => 'új oszlopban'],
    ],

    'found' => [
        'page_setup' => [
            'page_size' => 'Lapméret: :value',
            'orientation' => 'Tájolás: :value',
            'margin_top' => 'Felső margó: :value',
            'margin_bottom' => 'Alsó margó: :value',
            'margin_left' => 'Bal margó: :value',
            'margin_right' => 'Jobb margó: :value',
        ],
        'character_format' => [
            'font' => 'Betűtípus: :value',
            'font_size' => 'Betűméret: :value pt',
            'color' => 'Betűszín: :value',
            'bold' => 'Félkövér: :value',
            'italic' => 'Dőlt: :value',
            'underline' => 'Aláhúzott: :value',
            'small_caps' => 'Kiskapitális: :value',
            'superscript' => 'Felső index: :value',
            'subscript' => 'Alsó index: :value',
        ],
        'paragraph_format' => [
            'alignment' => 'Igazítás: :value',
            'space_before' => 'Térköz előtte: :value',
            'space_after' => 'Térköz utána: :value',
            'line_spacing' => 'Sorköz: :value',
            'indent_left' => 'Bal behúzás: :value',
            'indent_first' => 'Első sor behúzása: :value',
            'hyphenation' => 'Elválasztás: :value',
            'page_break_before' => 'Oldaltörés előtte: :value',
        ],
        'style' => [
            'exists' => 'A stílus létezik: :value',
            'applied' => 'Használja valamelyik bekezdés: :value',
            'applied_name' => 'A bekezdés stílusa: :value',
        ],
        'document_table' => [
            'rows' => 'Sorok: :value',
            'columns' => 'Oszlopok: :value',
            'border' => 'Szegély: :value',
            'width' => 'Szélesség: :value',
            'height' => 'Magasság: :value',
            'shading' => 'Árnyékolás: :value',
            'alignment' => 'Igazítás: :value',
        ],
        'image' => [
            'width' => 'Szélesség: :value',
            'height' => 'Magasság: :value',
            'aspect_ratio' => 'Oldalarány: :value',
            'wrap' => 'Körbefuttatás: :value',
            'alt_text' => 'Alternatív szöveg: :value',
            'count' => 'Képek száma: :value',
        ],
        'section' => [
            'columns' => 'Oszlopok: :value',
            'break_before' => 'A szakasz kezdete: :value',
            'page_orientation' => 'Tájolás: :value',
        ],
        'tab_stop' => [
            'position' => 'Tabulátorállók: :value',
            'type' => 'Tabulátortípusok: :value',
            'leader' => 'Kitöltés: :value',
        ],
        'list_format' => [
            'type' => 'Listatípus: :value',
            'level' => 'Szint: :value',
            'symbol' => 'Jel: :value',
        ],
    ],
];
