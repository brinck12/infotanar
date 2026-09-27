<?php

namespace Database\Seeders;

use App\Models\Task;
use App\Models\Topic;
use Illuminate\Database\Seeder;

/**
 * Rogzitett adatok a Playwright API teszteknek (tests/api).
 *
 * Csak egy uresen migralt adatbazison fut (migrate:fresh utan), ezert az
 * azonositok determinisztikusak: a letrehozas sorrendje itt a szerzodes.
 * A teszt a nem publikus feladatot (2. sorrend -> id 2) az azonositoval
 * eri el, mert az nem jelenik meg a listaban.
 */
class ApiTestSeeder extends Seeder
{
    public function run(): void
    {
        $topic = Topic::create(['name' => 'PW teszt témakör', 'slug' => 'pw-teszt-temakor']);

        // id 1 — fo feladat: futtatas/beadas/rejtett-teszteset szcenariokhoz.
        $main = Task::create([
            'topic_id' => $topic->id,
            'title' => 'PW teszt: Összegzés',
            'description' => 'Playwright API teszt fixture — nem valodi feladat.',
            'level' => 'kozep',
            'difficulty' => 1,
            'allowed_languages' => ['python', 'csharp'],
            'starter_code' => ['python' => "print()\n"],
            'is_published' => true,
        ]);
        $main->testCases()->createMany([
            ['stdin' => "1\n", 'expected_stdout' => "1\n", 'is_hidden' => false, 'order' => 0],
            ['stdin' => "2\n", 'expected_stdout' => "2\n", 'is_hidden' => false, 'order' => 1],
            ['stdin' => "3\n", 'expected_stdout' => "3\n", 'is_hidden' => true, 'order' => 2],
            ['stdin' => "4\n", 'expected_stdout' => "4\n", 'is_hidden' => true, 'order' => 3],
        ]);

        // id 2 — nem publikalt: lista/reszlet 404 szcenariohoz.
        Task::create([
            'topic_id' => $topic->id,
            'title' => 'PW teszt: Nem publikus feladat',
            'description' => 'Playwright API teszt fixture — nem valodi feladat.',
            'level' => 'kozep',
            'difficulty' => 1,
            'allowed_languages' => ['python'],
            'starter_code' => ['python' => "print()\n"],
            'is_published' => false,
        ]);

        // id 3 — csak C#-on oldhato meg: nyelv-validacios szcenariohoz.
        $csharpOnly = Task::create([
            'topic_id' => $topic->id,
            'title' => 'PW teszt: Csak C# feladat',
            'description' => 'Playwright API teszt fixture — nem valodi feladat.',
            'level' => 'kozep',
            'difficulty' => 2,
            'allowed_languages' => ['csharp'],
            'starter_code' => ['csharp' => "// TODO\n"],
            'is_published' => true,
        ]);
        $csharpOnly->testCases()->create([
            'stdin' => "1\n", 'expected_stdout' => "1\n", 'is_hidden' => false, 'order' => 0,
        ]);

        // id 4 — emelt szint: szint-szures szcenariohoz.
        $advanced = Task::create([
            'topic_id' => $topic->id,
            'title' => 'PW teszt: Emelt szintű feladat',
            'description' => 'Playwright API teszt fixture — nem valodi feladat.',
            'level' => 'emelt',
            'difficulty' => 3,
            'allowed_languages' => ['python'],
            'starter_code' => ['python' => "print()\n"],
            'is_published' => true,
        ]);
        $advanced->testCases()->create([
            'stdin' => "1\n", 'expected_stdout' => "1\n", 'is_hidden' => false, 'order' => 0,
        ]);
    }
}
