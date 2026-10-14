<?php

declare(strict_types=1);

$megabyte = 1024 * 1024;

// Szovegkent (nem ::class), mert az osztalyok egy resze csak kesobbi csomagban jon letre.
$spreadsheet = 'App\\Services\\FileTasks\\Spreadsheet\\';
$document = 'App\\Services\\FileTasks\\Document\\';
$presentation = 'App\\Services\\FileTasks\\Presentation\\';
$vector = 'App\\Services\\FileTasks\\Vector\\';
$web = 'App\\Services\\FileTasks\\Web\\';
$image = 'App\\Services\\FileTasks\\Image\\';

return [
    /*
    |--------------------------------------------------------------------------
    | Tarolok
    |--------------------------------------------------------------------------
    | Mindketto privat (config/filesystems.php), a fajlok csak alairt URL-en at
    | erhetok el. Az `exercise_files` a szerzoi tartalom (forrasfajlok, mintak:
    | potolhatatlan, mentjuk), a `submission_files` a diakok beadasai (nem
    | mentjuk: a pontszam es az eredmeny az adatbazisban van). Kesobb
    | S3-kompatibilis tarolora cserelhetok.
    */
    'disks' => [
        'exercise_files' => env('EXERCISE_FILES_DISK', 'exercise_files'),
        'submission_files' => env('SUBMISSION_FILES_DISK', 'submission_files'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Fajlfeladatok ertekelese
    |--------------------------------------------------------------------------
    */
    // A feladat megoldottnak szamit, ha a pontszam eleri az ertekelolap ennyi reszet
    // (felfele kerekitve); a kezi pontok csak megjelolve szamitanak bele.
    'pass_ratio' => (float) env('FILETASKS_PASS_RATIO', 0.8),

    // Feladatonkent es diakonkent ennyi gyakorlo beadas marad meg (a regebbiek fajlostul torlodnek).
    'keep_per_exercise' => (int) env('FILETASKS_KEEP_PER_EXERCISE', 10),

    // Ennel regebbi beadasokat es vizsgaprobalkozasokat a napi takaritas torli.
    'retention_days' => (int) env('FILETASKS_RETENTION_DAYS', 365),

    // A diaknak kiadott alairt letoltesi URL-ek elettartama (perc).
    'url_ttl_minutes' => (int) env('FILETASKS_URL_TTL_MINUTES', 60),

    // Egy fajl ertekelesenek faliora-korlatja (mp). Maradjon a frontend 60 mp-es
    // keres-timeoutja es az nginx fastcgi_read_timeout-ja alatt.
    'evaluation_timeout' => (int) env('FILETASKS_EVALUATION_TIMEOUT', 25),

    // Egyszerre ennyi ertekeles futhat; folotte 503, hogy a keresek ne a PHP-FPM
    // workerei mogott alljanak sorba.
    'max_concurrent_evaluations' => (int) env('FILETASKS_MAX_CONCURRENT_EVALUATIONS', 4),

    // Hosszusagok (margo, tabulator, kepmeret) ekkora elteressel egyeznek (mm).
    'length_tolerance_mm' => (float) env('FILETASKS_LENGTH_TOLERANCE_MM', 1.0),

    // Opcionalis viruskereso: pl. "clamdscan --no-summary {path}". Uresen kikapcsolva.
    // Nem nulla kilepesi kodnal a feltoltest elutasitjuk.
    'scan_command' => env('FILETASKS_SCAN_COMMAND'),

    /*
    |--------------------------------------------------------------------------
    | Meretkorlatok
    |--------------------------------------------------------------------------
    | Kategoriankent, byte-ban. Ketszer ervenyesul: a FormRequest `max`
    | szabalyaban (magyar 422) es az UploadedFileInspectorban. Az nginx es a
    | PHP korlatja (docs/runbooks/go-live.md) ezek folott kell legyen.
    */
    'max_bytes' => [
        'document' => (int) env('FILETASKS_MAX_DOCUMENT_MB', 10) * $megabyte,
        'image' => (int) env('FILETASKS_MAX_IMAGE_MB', 5) * $megabyte,
        'text' => (int) env('FILETASKS_MAX_TEXT_KB', 1024) * 1024,
        // Vizsga forras-zip; csak admin toltheti fel.
        'archive' => (int) env('FILETASKS_MAX_ARCHIVE_MB', 50) * $megabyte,
    ],

    // Egy XML-resz legfeljebb ekkora lehet kicsomagolva; a tenylegesen
    // beolvasott byte-okat szamoljuk, mert a zip fejlece hazudhat.
    'xml_part_max_bytes' => 8 * $megabyte,

    // Ennyi DOM-csomopont utan az olvaso megall (UnreadableFile).
    'max_dom_nodes' => 200_000,

    /*
    |--------------------------------------------------------------------------
    | Kiterjesztesek
    |--------------------------------------------------------------------------
    | Kiterjesztes (ponttal, kisbetuvel) => meretkategoria. Ami itt nincs, azt
    | semmilyen feltoltes nem fogadja el. Egy feladat ennek reszhalmazat
    | engedi (spec.accepted_extensions, a fajtajahoz illoen).
    */
    'extensions' => [
        '.docx' => 'document',
        '.odt' => 'document',
        '.xlsx' => 'document',
        '.ods' => 'document',
        '.pptx' => 'document',
        '.odp' => 'document',
        '.svg' => 'image',
        '.png' => 'image',
        // Csak admin csatolmanykent (mintakep, forrasfajl); diak nem adhatja be.
        '.jpg' => 'image',
        '.jpeg' => 'image',
        '.webp' => 'image',
        '.html' => 'text',
        '.css' => 'text',
        '.sql' => 'text',
        '.py' => 'text',
        '.cs' => 'text',
        '.txt' => 'text',
        '.csv' => 'text',
        '.zip' => 'archive',
    ],

    // Makros es futtathato csaladok: akkor is elutasitjuk, ha valaki felsorolja oket.
    'blocked_extensions' => [
        '.docm', '.dotm', '.xlsm', '.xlsb', '.xlam', '.pptm', '.ppam', '.potm', '.sldm',
        '.exe', '.dll', '.bat', '.cmd', '.ps1', '.js', '.vbs', '.jar', '.msi',
    ],

    // A fentiek kozul a makros irodai formatumok: ezekre a "mentsd makro nelkul" uzenet megy.
    'macro_extensions' => ['.docm', '.dotm', '.xlsm', '.xlsb', '.xlam', '.pptm', '.ppam', '.potm', '.sldm'],

    /*
    |--------------------------------------------------------------------------
    | Zip-biztonsag (OOXML, ODF, forras-zip)
    |--------------------------------------------------------------------------
    | Soha nem csomagolunk ki lemezre; ezek a korlatok a zip-bombak ellen vedenek.
    */
    'zip' => [
        'max_entries' => 2000,
        'max_total_bytes' => 150 * $megabyte,
        'max_entry_bytes' => 50 * $megabyte,
        // Egy bejegyzes kicsomagolt/tomoritett aranya legfeljebb ennyi lehet.
        'max_ratio' => 200,
        // Ennel kisebb bejegyzesnel az aranyt nem nezzuk: par szaz byte-nyi
        // ismetlodo XML aranya artalmatlanul is nagy lehet.
        'ratio_floor_bytes' => 100 * 1024,
    ],

    /*
    |--------------------------------------------------------------------------
    | Feltoltesi keretek
    |--------------------------------------------------------------------------
    | Diak: fajlbeadas percenkent es naponta, fiokonkent. Admin: csatolmany-
    | feltoltes es ertekelolap-proba percenkent.
    */
    'rate' => [
        'per_minute' => (int) env('FILETASKS_RATE_PER_MINUTE', 6),
        'per_day' => (int) env('FILETASKS_RATE_PER_DAY', 150),
        'admin_upload_per_minute' => (int) env('FILETASKS_ADMIN_UPLOAD_PER_MINUTE', 30),
    ],

    /*
    |--------------------------------------------------------------------------
    | Csatolmanyok (admin)
    |--------------------------------------------------------------------------
    */
    'attachments' => [
        // Az admin eroforrasokban kiadott alairt URL elettartama (perc).
        'admin_url_ttl_minutes' => 30,

        // Kod- es SQL-feladat forrasfajljai es a tesztesetek bemeneti fajljai a
        // Judge0-hoz is elmennek: keves es kicsi fajl lehet.
        'judge0_max_files' => 5,
        'judge0_max_bytes' => 256 * 1024,
        // A Judge0 sajat fajlnevei a futtatasi konyvtarban: forrasfajl nem viselheti.
        'judge0_reserved_names' => ['script.py', 'script.sql', 'main.cs', 'compile', 'run'],

        // Fajlfeladat forrasfajljai (a diak letolti oket).
        'source_max_files' => 10,
        'source_max_bytes' => 5 * $megabyte,

        'sample_image_max_bytes' => 3 * $megabyte,
        'sample_image_extensions' => ['.png', '.jpg', '.jpeg', '.webp', '.svg'],

        'sample_solution_max_bytes' => 10 * $megabyte,
    ],

    /*
    |--------------------------------------------------------------------------
    | Olvasok es vizsgalatok
    |--------------------------------------------------------------------------
    | A CheckRegistry ezekbol epul. Az osztalyokat a tulajdonos csomagok hozzak
    | letre; amelyik meg nem letezik, azt a registry kihagyja (class_exists),
    | igy az alkalmazas addig is elindul, es a hianyzo csalad automatikus
    | pontjait az ertekelolap-szerkeszto elutasitja.
    |
    | Olvaso: FileTasks\FileReader, kiterjesztesenkent egy. Vizsgalat:
    | FileTasks\CheckHandler; egy tipushoz tobb kezelo is tartozhat (pl. `image`
    | dokumentumban es bemutatoban), kozuluk az elso nyer, amelyik a megnyitott
    | fajlt tamogatja (supports()).
    */
    'readers' => [
        // WP3: .xlsx, .ods
        $spreadsheet.'SpreadsheetReader',
        // WP4: .docx, .odt
        $document.'DocumentReader',
        // WP5: .pptx, .odp / .svg / .html, .css / .png
        $presentation.'PresentationReader',
        $vector.'SvgReader',
        $web.'HtmlReader',
        $image.'PngReader',
    ],

    'checks' => [
        // WP3
        $spreadsheet.'Checks\\CellValueCheck',
        $spreadsheet.'Checks\\CellFormulaCheck',
        $spreadsheet.'Checks\\NumberFormatCheck',
        $spreadsheet.'Checks\\SortOrderCheck',
        $spreadsheet.'Checks\\ChartCheck',
        $spreadsheet.'Checks\\PrintAreaCheck',
        $spreadsheet.'Checks\\SheetFormatCheck',
        $spreadsheet.'Checks\\ConditionalFormatCheck',

        // WP4
        $document.'Checks\\PageSetupCheck',
        $document.'Checks\\CharacterFormatCheck',
        $document.'Checks\\ParagraphFormatCheck',
        $document.'Checks\\StyleCheck',
        $document.'Checks\\DocumentTableCheck',
        $document.'Checks\\ImageCheck',
        $document.'Checks\\SectionCheck',
        $document.'Checks\\TabStopCheck',
        $document.'Checks\\ListFormatCheck',

        // WP5
        $presentation.'Checks\\SlideCheck',
        $presentation.'Checks\\AnimationCheck',
        $presentation.'Checks\\ShapeCheck',
        $presentation.'Checks\\ImageCheck',
        $vector.'Checks\\ShapeCheck',
        $vector.'Checks\\ImageCheck',
        $web.'Checks\\WebCheck',
        $image.'Checks\\ImageCheck',
    ],
];
