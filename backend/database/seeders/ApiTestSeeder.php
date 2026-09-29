<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Actions\Catalog\ApplyFreemiumDefaults;
use App\Enums\Role;
use App\Models\Exercise;
use App\Models\Lesson;
use App\Models\Module;
use App\Models\Track;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * Rogzitett adatok a Playwright API teszteknek (tests/specs/api).
 *
 * Csak egy uresen migralt adatbazison fut (migrate:fresh utan), ezert az
 * azonositok determinisztikusak: a letrehozas sorrendje itt a szerzodes.
 * A teszt a nem publikus feladatot (2. sorrend -> id 2) az azonositoval
 * eri el, mert az nem jelenik meg a listaban.
 */
final class ApiTestSeeder extends Seeder
{
    private Module $module;

    private int $position = 0;

    public function run(): void
    {
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
