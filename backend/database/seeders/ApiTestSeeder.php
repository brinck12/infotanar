<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Actions\Catalog\ApplyFreemiumDefaults;
use App\Enums\AttachmentRole;
use App\Enums\ExamPartKey;
use App\Enums\ExerciseKind;
use App\Enums\Role;
use App\Enums\RubricCheckType;
use App\Enums\RubricMode;
use App\Models\Attachment;
use App\Models\Exam;
use App\Models\Exercise;
use App\Models\Lesson;
use App\Models\Module;
use App\Models\Track;
use App\Models\User;
use App\Services\Files\FileDisk;
use App\Services\Files\PrivateFileStore;
use App\Support\DisposableDatabase;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use RuntimeException;
use ZipArchive;

/**
 * Rogzitett adatok a Playwright API teszteknek (tests/specs/api).
 *
 * Csak egy uresen migralt adatbazison fut (migrate:fresh utan), ezert az
 * azonositok determinisztikusak: a letrehozas sorrendje itt a szerzodes.
 * A teszt a nem publikus feladatot (2. sorrend -> id 2) az azonositoval
 * eri el, mert az nem jelenik meg a listaban.
 *
 * A tesztoldali tukre a tests/src/data/seed.ts: a kettot egyutt kell
 * modositani. A csatolmanyok fajljai a privat `exercise_files` tarolora
 * kerulnek; a tarolokat a test:prepare-api-fixtures uriti a seed elott.
 */
final class ApiTestSeeder extends Seeder
{
    /** Az `adatok.txt` forrasfajl tartalma: harom szam (darabszam 3, osszeg 6). */
    private const DATA_FILE = "1\n2\n3\n";

    /** 1x1 keppontos PNG, base64-ben. */
    private const PNG_1X1 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

    private Module $module;

    private int $position = 0;

    public function run(): void
    {
        // Kozvetlenul (db:seed --class=...) hivva se kerulhessen teszt-adat eles adatbazisba.
        $refusal = DisposableDatabase::refusal();

        if ($refusal !== null) {
            throw new RuntimeException($refusal);
        }

        $track = Track::create(['slug' => 'pw-teszt-track', 'title' => 'PW teszt track', 'position' => 0]);
        $this->module = Module::create([
            'track_id' => $track->id,
            'slug' => 'pw-teszt-temakor',
            'title' => 'PW teszt témakör',
            'position' => 0,
        ]);

        // id 1 — fo feladat: futtatas/beadas/rejtett-teszteset szcenariokhoz.
        $main = $this->exercise('PW teszt: Összegzés', [
            'level' => 'kozep',
            'difficulty' => 1,
            'allowed_languages' => ['python', 'csharp'],
            'starter_code' => ['python' => "print()\n"],
        ]);
        $main->testCases()->createMany([
            ['stdin' => "1\n", 'expected_stdout' => "1\n", 'is_hidden' => false, 'order' => 0],
            ['stdin' => "2\n", 'expected_stdout' => "2\n", 'is_hidden' => false, 'order' => 1],
            ['stdin' => "3\n", 'expected_stdout' => "3\n", 'is_hidden' => true, 'order' => 2],
            ['stdin' => "4\n", 'expected_stdout' => "4\n", 'is_hidden' => true, 'order' => 3],
        ]);

        // id 2 — nem publikalt: lista/reszlet 404 szcenariohoz.
        $this->exercise('PW teszt: Nem publikus feladat', [
            'level' => 'kozep',
            'difficulty' => 1,
            'allowed_languages' => ['python'],
            'starter_code' => ['python' => "print()\n"],
        ], published: false);

        // id 3 — csak C#-on oldhato meg: nyelv-validacios szcenariohoz.
        $this->exercise('PW teszt: Csak C# feladat', [
            'level' => 'kozep',
            'difficulty' => 2,
            'allowed_languages' => ['csharp'],
            'starter_code' => ['csharp' => "// TODO\n"],
        ])->testCases()->create(['stdin' => "1\n", 'expected_stdout' => "1\n", 'is_hidden' => false, 'order' => 0]);

        // id 4 — emelt szint: szint-szures szcenariohoz.
        $this->exercise('PW teszt: Emelt szintű feladat', [
            'level' => 'emelt',
            'difficulty' => 3,
            'allowed_languages' => ['python'],
            'starter_code' => ['python' => "print()\n"],
        ])->testCases()->create(['stdin' => "1\n", 'expected_stdout' => "1\n", 'is_hidden' => false, 'order' => 0]);

        // Freemium: az 1-2. lecke (id 1, 2) ingyenes, a 3-4. (id 3, 4) fizetos.
        app(ApplyFreemiumDefaults::class)->handle($track);

        // Rogzitett, megerositett fiokok a jogosultsagi szcenariokhoz; jelszo: Titkos123.
        foreach (['admin@infotanar.test' => Role::Admin, 'student@infotanar.test' => Role::Student] as $email => $role) {
            (new User)->forceFill([
                'name' => 'PW '.$role->value,
                'email' => $email,
                'password' => 'Titkos123',
                'role' => $role,
                'email_verified_at' => now(),
            ])->save();
        }

        // A tipusos feladatok es a vizsgak a regi fixture-ok UTAN jonnek, kulon modulban:
        // igy a regi azonositok, a temakor feladatszama es a freemium-kiosztas valtozatlan.
        $typed = $this->typedTasks($track);
        $this->exams($typed['sheet'], $typed['subtasks']);

        // Utolso, hogy a korabbi azonositok ne csusszanak el: piszkozat track publikalt leckevel es feladattal.
        $this->draftTrack();
    }

    /** Nem publikalt track, amelynek leckeje es feladata onmagaban publikalt: diaknak sehol sem lathato (B10). */
    private function draftTrack(): void
    {
        $track = Track::create(['slug' => 'pw-piszkozat-track', 'title' => 'PW piszkozat track', 'position' => 9, 'is_published' => false]);
        $this->module = Module::create(['track_id' => $track->id, 'slug' => 'pw-piszkozat-temakor', 'title' => 'PW piszkozat témakör', 'position' => 0]);

        $exercise = $this->exercise('PW teszt: Piszkozat track feladata', [
            'level' => 'kozep',
            'difficulty' => 1,
            'allowed_languages' => ['python'],
            'starter_code' => ['python' => "print()\n"],
        ]);
        $exercise->lesson->forceFill(['is_free' => true])->save();
        $exercise->testCases()->create(['stdin' => "1\n", 'expected_stdout' => "1\n", 'is_hidden' => false, 'order' => 0]);
    }

    /**
     * Masodik modul a tipusos feladatoknak (feladat- es leckeazonosito 5..9, mind kozepszint).
     * Az `is_free` itt kifejezetten all: az ApplyFreemiumDefaults mar lefutott.
     *
     * @return array{sheet: Exercise, subtasks: Exercise}
     */
    private function typedTasks(Track $track): array
    {
        $this->module = Module::create([
            'track_id' => $track->id,
            'slug' => 'pw-tipusos-temakor',
            'title' => 'PW teszt típusos témakör',
            'position' => 1,
        ]);
        $this->position = 0;

        // id 5 — tablazatos fajlfeladat ertekelolappal (10 pont) es mintakeppel; ingyenes lecke.
        $sheet = $this->typedExercise('PW teszt: Táblázat feltöltés', ExerciseKind::SheetUpload, free: true, attributes: [
            'spec' => [
                'steps' => ['Rendezd a táblázatot.'],
                'deliverable' => 'tabla',
                'accepted_extensions' => ['.xlsx', '.ods'],
                'software' => ['Excel'],
                'exam_reference' => null,
                'exam_points' => 10,
                'raw_points' => 10,
            ],
        ]);
        $sheet->rubricItems()->createMany([
            [
                'position' => 0, 'group' => 'Képletek', 'label' => 'A B2 cella értéke 42',
                'check_type' => RubricCheckType::CellValue, 'property' => 'Munka1!B2', 'expected' => '42',
                'points' => 4, 'mode' => RubricMode::Auto, 'hint' => 'A B2 cellában 42-nek kell állnia.',
            ],
            [
                'position' => 1, 'group' => 'Képletek', 'label' => 'A B3 cellában SZUM függvény áll',
                'check_type' => RubricCheckType::CellFormula, 'property' => 'Munka1!B3', 'expected' => 'fn:SZUM',
                'points' => 3, 'mode' => RubricMode::Auto, 'hint' => 'A B3 cellába a SZUM függvénnyel számolj.',
            ],
            [
                'position' => 2, 'group' => 'Formázás', 'label' => 'A B2 cella két tizedesjegyet mutat',
                'check_type' => RubricCheckType::NumberFormat, 'property' => 'Munka1!B2', 'expected' => '0,00',
                'points' => 2, 'mode' => RubricMode::Auto, 'hint' => 'Állíts be két tizedesjegyet a B2 cellán.',
            ],
            [
                'position' => 3, 'group' => 'Formázás', 'label' => 'A táblázat megjelenése egyezik a mintával',
                'check_type' => RubricCheckType::Manual, 'property' => '', 'expected' => '',
                'points' => 1, 'mode' => RubricMode::Manual, 'hint' => 'Hasonlítsd a mintához.',
            ],
        ]);
        // Csatolmany id 1.
        $this->attach($sheet, AttachmentRole::SampleImage, 'minta.png', (string) base64_decode(self::PNG_1X1, true), 'image/png');

        // id 6 — szoveges fajlfeladat fizetos leckeben: zarolasi szcenariokhoz.
        $this->typedExercise('PW teszt: Szöveg feltöltés', ExerciseKind::DocUpload, free: false, attributes: [
            'spec' => [
                'steps' => ['Állítsd be a lapméretet.'],
                'deliverable' => 'szoveg',
                'accepted_extensions' => ['.docx'],
                'software' => ['Word'],
                'exam_reference' => null,
                'exam_points' => null,
                'raw_points' => null,
            ],
        ])->rubricItems()->create([
            'position' => 0, 'group' => 'Oldalbeállítás', 'label' => 'A lapméret A4',
            'check_type' => RubricCheckType::PageSetup, 'property' => 'page_size', 'expected' => 'A4',
            'points' => 2, 'mode' => RubricMode::Auto, 'hint' => 'Állítsd a lapméretet A4-re.',
        ]);

        // id 7 — weboldal-feladat: a bongeszo ellenoriz, a szerveren nincs beadas.
        $this->typedExercise('PW teszt: Weboldal', ExerciseKind::Web, free: true, attributes: [
            'spec' => [
                'files' => [[
                    'name' => 'index.html',
                    'language' => 'html',
                    'content' => "<!DOCTYPE html>\n<html lang=\"hu\">\n<head>\n  <meta charset=\"utf-8\">\n  <title></title>\n</head>\n<body>\n</body>\n</html>\n",
                ]],
                'checks' => [[
                    'id' => 1, 'label' => 'Az oldal címe „PW teszt”', 'points' => 1,
                    'hint' => 'Írd be a címet a title elembe.', 'type' => 'title', 'value' => 'PW teszt',
                ]],
                'exam_reference' => null,
            ],
        ]);

        // id 8 — reszfeladatos kodfeladat forrasfajllal (2 + 3 pont).
        $subtasks = $this->typedExercise('PW teszt: Részfeladatok', ExerciseKind::Code, free: true, attributes: [
            'allowed_languages' => ['python'],
            'starter_code' => ['python' => "print()\n"],
            'spec' => [
                'subtasks' => [
                    ['number' => 1, 'label' => 'Darabszám', 'points' => 2],
                    ['number' => 2, 'label' => 'Összeg', 'points' => 3],
                ],
            ],
        ]);
        $subtasks->testCases()->create([
            'stdin' => '', 'expected_stdout' => "1. feladat\n3\n2. feladat\n6\n", 'is_hidden' => false, 'order' => 0,
        ]);
        // Csatolmany id 2.
        $this->attach($subtasks, AttachmentRole::Source, 'adatok.txt', self::DATA_FILE, 'text/plain');

        // id 9 — bongeszos tablazatos gyakorlo.
        $this->typedExercise('PW teszt: Táblázat böngészőben', ExerciseKind::SheetBrowser, free: true, attributes: [
            'spec' => [
                'columns' => 3,
                'rows' => 5,
                'cells' => ['A1' => '10', 'A2' => '20'],
                'checks' => [['id' => 1, 'label' => 'Az A3 cellában képlet áll', 'type' => 'has_formula', 'cell' => 'A3']],
            ],
        ]);

        return ['sheet' => $sheet, 'subtasks' => $subtasks];
    }

    /**
     * Vizsga 1: publikalt, idozitheto, ket resszel (reszek id 1, 2) es forras-zippel (csatolmany id 3).
     * Vizsga 2: 0 perces (az API ezt nem engedi, ezert kozvetlenul): azonnal lejar, igy az
     * idotullepes varakozas nelkul tesztelheto (resz id 3). Vizsga 3: nem publikus.
     */
    private function exams(Exercise $sheet, Exercise $subtasks): void
    {
        $exam = Exam::create([
            'session' => '2026-05', 'title' => 'PW teszt vizsga', 'level' => 'kozep',
            'minutes' => 30, 'points' => 20, 'is_published' => true, 'timed_mode' => true,
        ]);
        $exam->parts()->createMany([
            [
                'exercise_id' => $sheet->id, 'position' => 0, 'key' => ExamPartKey::Tablazat,
                'name' => 'Táblázatkezelés', 'points' => 10, 'minutes' => 15,
            ],
            [
                'exercise_id' => $subtasks->id, 'position' => 1, 'key' => ExamPartKey::Programozas,
                'name' => 'Algoritmizálás és programozás', 'points' => 10, 'minutes' => 15,
            ],
        ]);
        $this->attach($exam, AttachmentRole::SourceZip, 'forrasok.zip', $this->zipOf(['adatok.txt' => self::DATA_FILE]), 'application/zip');

        Exam::create([
            'session' => '2026-10', 'title' => 'PW teszt vizsga (lejárt)', 'level' => 'kozep',
            'minutes' => 0, 'points' => 10, 'is_published' => true, 'timed_mode' => true,
        ])->parts()->create([
            'exercise_id' => $sheet->id, 'position' => 0, 'key' => ExamPartKey::Tablazat,
            'name' => 'Táblázatkezelés', 'points' => 10, 'minutes' => 15,
        ]);

        Exam::create([
            'session' => '2027-05', 'title' => 'PW teszt vizsga (nem publikus)', 'level' => 'kozep',
            'minutes' => 30, 'points' => 10, 'is_published' => false, 'timed_mode' => true,
        ]);
    }

    /** @param array<string, mixed> $attributes */
    private function typedExercise(string $title, ExerciseKind $kind, bool $free, array $attributes): Exercise
    {
        $exercise = $this->exercise($title, [
            'kind' => $kind,
            'level' => 'kozep',
            'difficulty' => 1,
            'allowed_languages' => [],
            'starter_code' => [],
            ...$attributes,
        ]);

        $exercise->lesson()->update(['is_free' => $free]);

        return $exercise;
    }

    /** A fajlt a privat `exercise_files` tarolora irja, es letrehozza a csatolmany sorat. */
    private function attach(Exercise|Exam $owner, AttachmentRole $role, string $name, string $contents, string $mime): Attachment
    {
        $stored = app(PrivateFileStore::class)->putContents(
            FileDisk::ExerciseFiles,
            $owner->getMorphClass().'/'.$owner->id,
            $name,
            $contents,
            $mime,
        );

        return Attachment::create([
            'attachable_type' => $owner->getMorphClass(),
            'attachable_id' => $owner->id,
            'role' => $role,
            'name' => $stored->name,
            'path' => $stored->path,
            'size' => $stored->size,
            'sha256' => $stored->sha256,
            'mime' => $stored->mime,
            'position' => 0,
        ]);
    }

    /**
     * Zip a memoriaban, a megadott bejegyzesekkel.
     *
     * @param  array<string, string>  $entries  nev => tartalom
     */
    private function zipOf(array $entries): string
    {
        $path = tempnam(sys_get_temp_dir(), 'pw-zip-');

        if ($path === false) {
            throw new RuntimeException('Nem hozhato letre ideiglenes fajl a fixture zipnek.');
        }

        $zip = new ZipArchive;
        $zip->open($path, ZipArchive::OVERWRITE);

        foreach ($entries as $name => $contents) {
            $zip->addFromString($name, $contents);
        }

        $zip->close();
        $bytes = (string) file_get_contents($path);
        unlink($path);

        return $bytes;
    }

    /** @param array<string, mixed> $attributes */
    private function exercise(string $title, array $attributes, bool $published = true): Exercise
    {
        $lesson = Lesson::create([
            'module_id' => $this->module->id,
            'slug' => Str::slug($title),
            'title' => $title,
            'position' => $this->position++,
            'is_published' => $published,
        ]);

        return Exercise::create([
            ...$attributes,
            'lesson_id' => $lesson->id,
            'title' => $title,
            'description' => 'Playwright API teszt fixture — nem valodi feladat.',
            'is_published' => $published,
        ]);
    }
}
