<?php

declare(strict_types=1);

namespace App\Services\Catalog\Content;

use DateTimeInterface;
use Symfony\Component\Yaml\Exception\ParseException;
use Symfony\Component\Yaml\Yaml;

/**
 * A tartalmi fa beolvasása: `_track.yml`, `_module.yml`, `lesson.md` (YAML fejléc + törzs) és
 * `exercises/*.yml`. Csak olvas; a hibákat a `ContentSet` problémái között adja vissza, nem dob kivételt.
 */
final class ContentReader
{
    /** A forrásfájlokban megengedett kulcsok (a fájl nyelvén, nem az adatbázis mezőnevein). */
    private const TRACK_KEYS = ['slug', 'title', 'description', 'position', 'published'];

    private const MODULE_KEYS = ['slug', 'title', 'description', 'position'];

    private const LESSON_KEYS = ['slug', 'title', 'position', 'free', 'published', 'reviewed_by', 'reviewed_at'];

    private const EXERCISE_KEYS = [
        'slug', 'title', 'position', 'kind', 'level', 'difficulty', 'published', 'allowed_languages',
        'description', 'starter_code', 'sample_solutions', 'constraints', 'sql_order_sensitive', 'limits', 'tests',
    ];

    private const TEST_KEYS = ['stdin', 'expected', 'hidden'];

    /** @var array<string, string> */
    private const RENAMES = ['free' => 'is_free', 'published' => 'is_published'];

    /** @var list<ContentProblem> */
    private array $problems = [];

    public function read(string $root): ContentSet
    {
        $this->problems = [];
        $root = rtrim($root, '/\\');

        if (! is_dir($root)) {
            return new ContentSet([], [ContentProblem::of($root, 'root_missing')]);
        }

        $tracks = [];
        foreach ($this->subdirectories($root) as $name) {
            $track = $this->readTrack($root.'/'.$name, $name);
            if ($track instanceof TrackNode) {
                $tracks[] = $track;
            }
        }

        if ($tracks === [] && ! $this->hasProblems()) {
            $this->problems[] = ContentProblem::of($root, 'root_empty');
        }

        return new ContentSet($tracks, $this->problems);
    }

    private function hasProblems(): bool
    {
        return $this->problems !== [];
    }

    private function readTrack(string $dir, string $rel): ?TrackNode
    {
        $file = $rel.'/_track.yml';
        $data = $this->readYamlFile($dir.'/_track.yml', $file);
        if ($data === null) {
            return null;
        }

        $modules = [];
        foreach ($this->subdirectories($dir) as $name) {
            $module = $this->readModule($dir.'/'.$name, $rel.'/'.$name);
            if ($module instanceof ModuleNode) {
                $modules[] = $module;
            }
        }

        return new TrackNode($file, $this->attributes($data, self::TRACK_KEYS, $file), $modules);
    }

    private function readModule(string $dir, string $rel): ?ModuleNode
    {
        $file = $rel.'/_module.yml';
        $data = $this->readYamlFile($dir.'/_module.yml', $file);
        if ($data === null) {
            return null;
        }

        $lessons = [];
        foreach ($this->subdirectories($dir) as $name) {
            $lesson = $this->readLesson($dir.'/'.$name, $rel.'/'.$name);
            if ($lesson instanceof LessonNode) {
                $lessons[] = $lesson;
            }
        }

        return new ModuleNode($file, $this->attributes($data, self::MODULE_KEYS, $file), $lessons);
    }

    private function readLesson(string $dir, string $rel): ?LessonNode
    {
        $file = $rel.'/lesson.md';
        $raw = $this->readText($dir.'/lesson.md', $file);
        if ($raw === null) {
            return null;
        }

        $split = $this->splitFrontMatter($raw, $file);
        if ($split === null) {
            return null;
        }

        $data = $this->parseMap($split['header'], $file);
        if ($data === null) {
            return null;
        }

        $reviewedBy = $data['reviewed_by'] ?? null;
        $reviewedAt = $data['reviewed_at'] ?? null;
        unset($data['reviewed_by'], $data['reviewed_at']);

        $exercises = [];
        $exerciseDir = $dir.'/exercises';
        if (is_dir($exerciseDir)) {
            $names = glob($exerciseDir.'/*.yml') ?: [];
            sort($names);
            foreach ($names as $path) {
                $exercise = $this->readExercise($path, $rel.'/exercises/'.basename($path));
                if ($exercise instanceof ExerciseNode) {
                    $exercises[] = $exercise;
                }
            }
        }

        return new LessonNode(
            $file,
            $this->attributes($data, array_diff(self::LESSON_KEYS, ['reviewed_by', 'reviewed_at']), $file),
            $split['body'],
            $exercises,
            $this->scalarText($reviewedBy),
            $this->scalarText($reviewedAt),
        );
    }

    private function readExercise(string $path, string $file): ?ExerciseNode
    {
        $data = $this->readYamlFile($path, $file);
        if ($data === null) {
            return null;
        }

        $tests = $data['tests'] ?? [];
        unset($data['tests']);

        return new ExerciseNode(
            $file,
            $this->attributes($data, array_diff(self::EXERCISE_KEYS, ['tests']), $file),
            $this->testCases($tests, $file),
        );
    }

    /**
     * @return list<array{stdin: string, expected_stdout: string, is_hidden: bool, order: int}>
     */
    private function testCases(mixed $tests, string $file): array
    {
        if (! is_array($tests) || ! array_is_list($tests)) {
            $this->problems[] = ContentProblem::of($file, 'invalid_type', ['field' => 'tests', 'expected' => 'lista']);

            return [];
        }

        $cases = [];
        foreach ($tests as $index => $entry) {
            $number = $index + 1;
            if (! is_array($entry)) {
                $this->problems[] = ContentProblem::of($file, 'test_invalid', ['number' => $number, 'detail' => 'nem kulcs-érték lista']);

                continue;
            }

            $valid = true;
            foreach (array_keys($entry) as $key) {
                if (! in_array($key, self::TEST_KEYS, true)) {
                    $this->problems[] = ContentProblem::of($file, 'test_invalid', [
                        'number' => $number,
                        'detail' => (string) __('catalog_import.unknown_key', ['key' => (string) $key]),
                    ]);
                    $valid = false;
                }
            }

            $stdin = $entry['stdin'] ?? '';
            $expected = $entry['expected'] ?? null;
            $hidden = $entry['hidden'] ?? false;
            if (! is_string($stdin) || ! is_string($expected) || ! is_bool($hidden)) {
                $this->problems[] = ContentProblem::of($file, 'test_invalid', [
                    'number' => $number,
                    'detail' => 'a „stdin” és „expected” szöveg, a „hidden” igaz/hamis érték legyen (az „expected” kötelező)',
                ]);
                $valid = false;
            }

            if ($valid && is_string($stdin) && is_string($expected) && is_bool($hidden)) {
                $cases[] = ['stdin' => $stdin, 'expected_stdout' => $expected, 'is_hidden' => $hidden, 'order' => $index];
            }
        }

        return $cases;
    }

    /**
     * Forráskulcsok ellenőrzése és leképezése adatbázis-mezőnevekre; az alapértelmezett `is_published` false.
     *
     * @param  array<string, mixed>  $data
     * @param  array<array-key, string>  $allowed
     * @return array<string, mixed>
     */
    private function attributes(array $data, array $allowed, string $file): array
    {
        $attributes = [];
        foreach ($data as $key => $value) {
            if (! in_array($key, $allowed, true)) {
                $this->problems[] = ContentProblem::of($file, 'unknown_key', ['key' => $key]);

                continue;
            }
            $attributes[self::RENAMES[$key] ?? $key] = $value;
        }

        if (in_array('published', $allowed, true) && ! array_key_exists('is_published', $attributes)) {
            $attributes['is_published'] = false;
        }

        return $attributes;
    }

    /**
     * @return array<string, mixed>|null
     */
    private function readYamlFile(string $path, string $file): ?array
    {
        $text = $this->readText($path, $file);

        return $text === null ? null : $this->parseMap($this->normalize($text), $file);
    }

    private function readText(string $path, string $file): ?string
    {
        if (! is_file($path)) {
            $this->problems[] = ContentProblem::of($file, 'missing_file', ['name' => basename($file)]);

            return null;
        }

        $text = file_get_contents($path);
        if ($text === false) {
            $this->problems[] = ContentProblem::of($file, 'unreadable');

            return null;
        }

        return $this->normalize($text);
    }

    /** BOM levágása és `\r\n`/`\r` sorvég egységesítése `\n`-re. */
    private function normalize(string $text): string
    {
        if (str_starts_with($text, "\xEF\xBB\xBF")) {
            $text = substr($text, 3);
        }

        return str_replace(["\r\n", "\r"], "\n", $text);
    }

    /**
     * A fejléc a fájl első `---` sorától az első önálló `---` sorig tart; a maradék a törzs, szó szerint.
     *
     * @return array{header: string, body: string}|null
     */
    private function splitFrontMatter(string $text, string $file): ?array
    {
        $lines = explode("\n", $text);
        if (rtrim($lines[0]) !== '---') {
            $this->problems[] = ContentProblem::of($file, 'header_missing');

            return null;
        }

        for ($i = 1, $count = count($lines); $i < $count; $i++) {
            if (rtrim($lines[$i]) === '---') {
                return [
                    'header' => implode("\n", array_slice($lines, 1, $i - 1)),
                    'body' => implode("\n", array_slice($lines, $i + 1)),
                ];
            }
        }

        $this->problems[] = ContentProblem::of($file, 'header_unclosed');

        return null;
    }

    /**
     * @return array<string, mixed>|null
     */
    private function parseMap(string $yaml, string $file): ?array
    {
        try {
            $parsed = Yaml::parse($yaml, Yaml::PARSE_DATETIME);
        } catch (ParseException $e) {
            $this->problems[] = ContentProblem::of($file, 'yaml_invalid', ['error' => $e->getMessage()]);

            return null;
        }

        // Üres fejléc (csak megjegyzés) null-t ad: üres térkép, a kötelező mezők hiányát a validátor jelzi.
        if ($parsed === null) {
            return [];
        }
        if (! is_array($parsed) || ($parsed !== [] && array_is_list($parsed))) {
            $this->problems[] = ContentProblem::of($file, 'yaml_not_map');

            return null;
        }

        $map = [];
        foreach ($parsed as $key => $value) {
            $map[(string) $key] = $value;
        }

        return $map;
    }

    private function scalarText(mixed $value): ?string
    {
        if ($value instanceof DateTimeInterface) {
            return $value->format('Y-m-d');
        }
        if (is_string($value) && $value !== '') {
            return $value;
        }

        return is_int($value) || is_float($value) ? (string) $value : null;
    }

    /**
     * @return list<string>
     */
    private function subdirectories(string $dir): array
    {
        $entries = scandir($dir);
        if ($entries === false) {
            return [];
        }

        $names = [];
        foreach ($entries as $entry) {
            if (! str_starts_with($entry, '.') && is_dir($dir.'/'.$entry)) {
                $names[] = $entry;
            }
        }
        sort($names);

        return $names;
    }
}
