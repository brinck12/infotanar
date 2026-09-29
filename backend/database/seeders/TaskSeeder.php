<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Task;
use App\Models\Topic;
use Illuminate\Database\Seeder;

/**
 * Öt érettségi-jellegű programozási mintafeladat, a klasszikus
 * programozási tételekre építve.
 */
class TaskSeeder extends Seeder
{
    public function run(): void
    {
        $tetelek = Topic::updateOrCreate(
            ['slug' => 'programozasi-tetelek'],
            ['name' => 'Programozási tételek']
        );

        $sorozat = Topic::updateOrCreate(
            ['slug' => 'sorozatfeldolgozas'],
            ['name' => 'Sorozatfeldolgozás']
        );

        foreach ($this->tasks($tetelek->id, $sorozat->id) as $definition) {
            $testCases = $definition['test_cases'];
            unset($definition['test_cases']);

            $task = Task::updateOrCreate(
                ['title' => $definition['title']],
                $definition
            );

            // Ujraseedelesnel ne duplazodjanak a tesztesetek.
            $task->testCases()->delete();

            foreach ($testCases as $order => $testCase) {
                $task->testCases()->create([...$testCase, 'order' => $order]);
            }
        }
    }

    /** @return list<array{title: string, test_cases: list<array<string, mixed>>}&array<string, mixed>> */
    private function tasks(int $tetelekId, int $sorozatId): array
    {
        return [
            [
                'topic_id' => $tetelekId,
                'title' => 'Összegzés tétele',
                'level' => 'kozep',
                'difficulty' => 1,
                'is_published' => true,
                'allowed_languages' => ['python', 'csharp'],
                'description' => <<<'MD'
## Feladat

Olvass be egy `N` egész számot, majd `N` darab egész számot, és írd ki az **összegüket**!

### Bemenet

- Az első sorban egy `N` egész szám (`1 ≤ N ≤ 100`).
- A következő `N` sorban egy-egy egész szám.

### Kimenet

Egyetlen sorban a számok összege.

### Példa

Bemenet: `3`, majd `5`, `10`, `15` — Kimenet: `30`
MD,
                'starter_code' => [
                    'python' => "n = int(input())\nosszeg = 0\nfor _ in range(n):\n    szam = int(input())\n    # TODO: add hozzá az összeghez\nprint(osszeg)\n",
                    'csharp' => "using System;\n\nclass Program\n{\n    static void Main()\n    {\n        int n = int.Parse(Console.ReadLine());\n        int osszeg = 0;\n        for (int i = 0; i < n; i++)\n        {\n            int szam = int.Parse(Console.ReadLine());\n            // TODO: add hozzá az összeghez\n        }\n        Console.WriteLine(osszeg);\n    }\n}\n",
                ],
                'test_cases' => [
                    ['stdin' => "3\n5\n10\n15\n", 'expected_stdout' => "30\n", 'is_hidden' => false],
                    ['stdin' => "1\n42\n", 'expected_stdout' => "42\n", 'is_hidden' => false],
                    ['stdin' => "5\n1\n2\n3\n4\n5\n", 'expected_stdout' => "15\n", 'is_hidden' => true],
                    ['stdin' => "4\n-3\n-7\n10\n0\n", 'expected_stdout' => "0\n", 'is_hidden' => true],
                ],
            ],
            [
                'topic_id' => $tetelekId,
                'title' => 'Megszámlálás tétele',
                'level' => 'kozep',
                'difficulty' => 2,
                'is_published' => true,
                'allowed_languages' => ['python', 'csharp'],
                'description' => <<<'MD'
## Feladat

Olvass be egy `N` egész számot, majd `N` darab egész számot. Írd ki, **hány darab páros szám** van közöttük!

### Bemenet

- Az első sorban egy `N` egész szám (`1 ≤ N ≤ 100`).
- A következő `N` sorban egy-egy egész szám.

### Kimenet

Egyetlen sorban a páros számok darabszáma.

### Példa

Bemenet: `4`, majd `1`, `2`, `3`, `4` — Kimenet: `2`
MD,
                'starter_code' => [
                    'python' => "n = int(input())\ndb = 0\nfor _ in range(n):\n    szam = int(input())\n    # TODO: számold meg a párosakat\nprint(db)\n",
                    'csharp' => "using System;\n\nclass Program\n{\n    static void Main()\n    {\n        int n = int.Parse(Console.ReadLine());\n        int db = 0;\n        for (int i = 0; i < n; i++)\n        {\n            int szam = int.Parse(Console.ReadLine());\n            // TODO: számold meg a párosakat\n        }\n        Console.WriteLine(db);\n    }\n}\n",
                ],
                'test_cases' => [
                    ['stdin' => "4\n1\n2\n3\n4\n", 'expected_stdout' => "2\n", 'is_hidden' => false],
                    ['stdin' => "3\n1\n3\n5\n", 'expected_stdout' => "0\n", 'is_hidden' => false],
                    ['stdin' => "5\n2\n4\n6\n8\n10\n", 'expected_stdout' => "5\n", 'is_hidden' => true],
                    ['stdin' => "4\n-2\n-1\n0\n7\n", 'expected_stdout' => "2\n", 'is_hidden' => true],
                ],
            ],
            [
                'topic_id' => $tetelekId,
                'title' => 'Maximumkiválasztás tétele',
                'level' => 'kozep',
                'difficulty' => 2,
                'is_published' => true,
                'allowed_languages' => ['python', 'csharp'],
                'description' => <<<'MD'
## Feladat

Olvass be egy `N` egész számot, majd `N` darab egész számot. Írd ki a **legnagyobbat** közülük!

### Bemenet

- Az első sorban egy `N` egész szám (`1 ≤ N ≤ 100`).
- A következő `N` sorban egy-egy egész szám.

### Kimenet

Egyetlen sorban a legnagyobb szám.

### Példa

Bemenet: `4`, majd `3`, `9`, `2`, `7` — Kimenet: `9`
MD,
                'starter_code' => [
                    'python' => "n = int(input())\nmax_ertek = None\nfor _ in range(n):\n    szam = int(input())\n    # TODO: tartsd nyilván a legnagyobbat\nprint(max_ertek)\n",
                    'csharp' => "using System;\n\nclass Program\n{\n    static void Main()\n    {\n        int n = int.Parse(Console.ReadLine());\n        int maxErtek = int.MinValue;\n        for (int i = 0; i < n; i++)\n        {\n            int szam = int.Parse(Console.ReadLine());\n            // TODO: tartsd nyilván a legnagyobbat\n        }\n        Console.WriteLine(maxErtek);\n    }\n}\n",
                ],
                'test_cases' => [
                    ['stdin' => "4\n3\n9\n2\n7\n", 'expected_stdout' => "9\n", 'is_hidden' => false],
                    ['stdin' => "1\n-5\n", 'expected_stdout' => "-5\n", 'is_hidden' => false],
                    ['stdin' => "5\n-10\n-3\n-99\n-1\n-50\n", 'expected_stdout' => "-1\n", 'is_hidden' => true],
                    ['stdin' => "3\n7\n7\n7\n", 'expected_stdout' => "7\n", 'is_hidden' => true],
                ],
            ],
            [
                'topic_id' => $tetelekId,
                'title' => 'Eldöntés tétele',
                'level' => 'kozep',
                'difficulty' => 3,
                'is_published' => true,
                'allowed_languages' => ['python', 'csharp'],
                'description' => <<<'MD'
## Feladat

Olvass be egy `N` egész számot, majd `N` darab egész számot. Döntsd el, **van-e közöttük negatív szám**!

### Bemenet

- Az első sorban egy `N` egész szám (`1 ≤ N ≤ 100`).
- A következő `N` sorban egy-egy egész szám.

### Kimenet

Egyetlen sorban `IGEN`, ha van negatív szám, egyébként `NEM`.

### Példa

Bemenet: `3`, majd `4`, `-2`, `8` — Kimenet: `IGEN`
MD,
                'starter_code' => [
                    'python' => "n = int(input())\nvan = False\nfor _ in range(n):\n    szam = int(input())\n    # TODO: jelöld, ha találtál negatívat\nprint('IGEN' if van else 'NEM')\n",
                    'csharp' => "using System;\n\nclass Program\n{\n    static void Main()\n    {\n        int n = int.Parse(Console.ReadLine());\n        bool van = false;\n        for (int i = 0; i < n; i++)\n        {\n            int szam = int.Parse(Console.ReadLine());\n            // TODO: jelöld, ha találtál negatívat\n        }\n        Console.WriteLine(van ? \"IGEN\" : \"NEM\");\n    }\n}\n",
                ],
                'test_cases' => [
                    ['stdin' => "3\n4\n-2\n8\n", 'expected_stdout' => "IGEN\n", 'is_hidden' => false],
                    ['stdin' => "3\n1\n2\n3\n", 'expected_stdout' => "NEM\n", 'is_hidden' => false],
                    ['stdin' => "1\n-1\n", 'expected_stdout' => "IGEN\n", 'is_hidden' => true],
                    ['stdin' => "4\n0\n0\n0\n0\n", 'expected_stdout' => "NEM\n", 'is_hidden' => true],
                ],
            ],
            [
                'topic_id' => $sorozatId,
                'title' => 'Kiválogatás tétele',
                'level' => 'emelt',
                'difficulty' => 4,
                'is_published' => true,
                'allowed_languages' => ['python', 'csharp'],
                'description' => <<<'MD'
## Feladat

Olvass be egy `N` egész számot, majd `N` darab egész számot. Írd ki **külön sorokba a 10-nél nagyobb számokat**, a beolvasás sorrendjében! Ha nincs ilyen szám, ne írj ki semmit.

### Bemenet

- Az első sorban egy `N` egész szám (`1 ≤ N ≤ 100`).
- A következő `N` sorban egy-egy egész szám.

### Kimenet

Soronként egy-egy 10-nél nagyobb szám.

### Példa

Bemenet: `4`, majd `5`, `12`, `3`, `20` — Kimenet: `12` és `20` külön sorokban
MD,
                'starter_code' => [
                    'python' => "n = int(input())\nfor _ in range(n):\n    szam = int(input())\n    # TODO: írd ki, ha nagyobb 10-nél\n",
                    'csharp' => "using System;\n\nclass Program\n{\n    static void Main()\n    {\n        int n = int.Parse(Console.ReadLine());\n        for (int i = 0; i < n; i++)\n        {\n            int szam = int.Parse(Console.ReadLine());\n            // TODO: írd ki, ha nagyobb 10-nél\n        }\n    }\n}\n",
                ],
                'test_cases' => [
                    ['stdin' => "4\n5\n12\n3\n20\n", 'expected_stdout' => "12\n20\n", 'is_hidden' => false],
                    ['stdin' => "3\n1\n2\n3\n", 'expected_stdout' => '', 'is_hidden' => false],
                    ['stdin' => "5\n11\n10\n9\n100\n-5\n", 'expected_stdout' => "11\n100\n", 'is_hidden' => true],
                    ['stdin' => "2\n10\n11\n", 'expected_stdout' => "11\n", 'is_hidden' => true],
                ],
            ],
        ];
    }
}
