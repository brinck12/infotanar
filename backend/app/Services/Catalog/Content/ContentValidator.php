<?php

declare(strict_types=1);

namespace App\Services\Catalog\Content;

use Illuminate\Support\Str;

/**
 * A beolvasott tartalmi fa szabályellenőrzése. Az értékhatárok megegyeznek az admin űrlapéval
 * (`ExerciseRequest`): level, difficulty, kódhosszak, nyelvek.
 */
final class ContentValidator
{
    private const LEVELS = ['kozep', 'emelt'];

    private const KINDS = ['code', 'sql'];

    private const LANGUAGES = ['python', 'csharp', 'sql'];

    private const STARTER_MAX = 20000;

    private const SOLUTION_MAX = 50000;

    /** @var array<string, list<string>> */
    private const KEYS = [
        'track' => ['slug', 'title', 'description', 'position', 'is_published'],
        'module' => ['slug', 'title', 'description', 'position'],
        'lesson' => ['slug', 'title', 'position', 'is_free', 'is_published'],
        'exercise' => [
            'slug', 'title', 'position', 'kind', 'level', 'difficulty', 'is_published', 'allowed_languages',
            'description', 'starter_code', 'sample_solutions', 'constraints', 'sql_order_sensitive', 'limits',
        ],
    ];

    /** @var list<ContentProblem> */
    private array $problems = [];

    /**
     * @return list<ContentProblem>
     */
    public function problems(ContentSet $set): array
    {
        $this->problems = $set->problems;

        $this->checkSiblings($set->tracks);
        foreach ($set->tracks as $track) {
            $this->checkCommon($track->path, $track->attributes, 'track');
            $this->checkOptionalText($track->path, $track->attributes, 'description');
            $this->checkBool($track->path, $track->attributes, 'is_published');

            $this->checkSiblings($track->modules);
            foreach ($track->modules as $module) {
                $this->checkCommon($module->path, $module->attributes, 'module');
                $this->checkOptionalText($module->path, $module->attributes, 'description');

                $this->checkSiblings($module->lessons);
                foreach ($module->lessons as $lesson) {
                    $this->checkCommon($lesson->path, $lesson->attributes, 'lesson');
                    $this->checkBool($lesson->path, $lesson->attributes, 'is_free');
                    $this->checkBool($lesson->path, $lesson->attributes, 'is_published');

                    $this->checkSiblings($lesson->exercises);
                    foreach ($lesson->exercises as $exercise) {
                        $this->checkExercise($exercise);
                    }
                }
            }
        }

        return $this->problems;
    }

    /**
     * @param  array<string, string|int>  $replace
     */
    private function add(string $file, string $key, array $replace = []): void
    {
        $this->problems[] = ContentProblem::of($file, $key, $replace);
    }

    /**
     * Közös mezők: ismeretlen kulcs, slug, cím, sorszám.
     *
     * @param  array<string, mixed>  $attributes
     */
    private function checkCommon(string $file, array $attributes, string $type): void
    {
        foreach (array_keys($attributes) as $key) {
            if (! in_array($key, self::KEYS[$type], true)) {
                $this->add($file, 'unknown_key', ['key' => $key]);
            }
        }

        $slug = $attributes['slug'] ?? null;
        if ($slug === null) {
            $this->add($file, 'required', ['field' => 'slug']);
        } elseif (! is_string($slug) || preg_match('/^[a-z0-9-]+$/', $slug) !== 1 || strlen($slug) > 255) {
            $this->add($file, 'slug_format', ['field' => 'slug']);
        }

        $title = $attributes['title'] ?? null;
        if ($title === null) {
            $this->add($file, 'required', ['field' => 'title']);
        } elseif (! is_string($title) || trim($title) === '') {
            $this->add($file, 'invalid_type', ['field' => 'title', 'expected' => 'nem üres szöveg']);
        } elseif (mb_strlen($title) > 255) {
            $this->add($file, 'too_long', ['field' => 'title', 'max' => 255]);
        }

        $position = $attributes['position'] ?? null;
        if ($position === null) {
            $this->add($file, 'required', ['field' => 'position']);
        } elseif (! is_int($position) || $position < 0) {
            $this->add($file, 'invalid_type', ['field' => 'position', 'expected' => 'nem negatív egész szám']);
        }
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    private function checkBool(string $file, array $attributes, string $field): void
    {
        if (array_key_exists($field, $attributes) && ! is_bool($attributes[$field])) {
            $this->add($file, 'invalid_type', ['field' => $field, 'expected' => 'igaz/hamis érték']);
        }
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    private function checkOptionalText(string $file, array $attributes, string $field): void
    {
        $value = $attributes[$field] ?? null;
        if ($value !== null && ! is_string($value)) {
            $this->add($file, 'invalid_type', ['field' => $field, 'expected' => 'szöveg']);
        }
    }

    private function checkExercise(ExerciseNode $exercise): void
    {
        $file = $exercise->path;
        $a = $exercise->attributes;

        $this->checkCommon($file, $a, 'exercise');
        $this->checkBool($file, $a, 'is_published');
        $this->checkBool($file, $a, 'sql_order_sensitive');

        $slug = $a['slug'] ?? null;
        $title = $a['title'] ?? null;
        if (is_string($slug) && is_string($title) && trim($title) !== '' && $slug !== Str::slug($title)) {
            $this->add($file, 'slug_title_mismatch', ['slug' => $slug, 'expected' => Str::slug($title)]);
        }

        $this->checkChoice($file, $a, 'kind', self::KINDS);
        $this->checkChoice($file, $a, 'level', self::LEVELS);

        $difficulty = $a['difficulty'] ?? null;
        if ($difficulty === null) {
            $this->add($file, 'required', ['field' => 'difficulty']);
        } elseif (! is_int($difficulty) || $difficulty < 1 || $difficulty > 5) {
            $this->add($file, 'out_of_range', ['field' => 'difficulty', 'min' => 1, 'max' => 5]);
        }

        $description = $a['description'] ?? null;
        if ($description === null) {
            $this->add($file, 'required', ['field' => 'description']);
        } elseif (! is_string($description) || trim($description) === '') {
            $this->add($file, 'invalid_type', ['field' => 'description', 'expected' => 'nem üres szöveg']);
        }

        $allowed = $this->checkLanguages($file, $a);
        $this->checkCodeMap($file, $a, 'starter_code', $allowed, self::STARTER_MAX);
        $this->checkCodeMap($file, $a, 'sample_solutions', $allowed, self::SOLUTION_MAX);

        if ($exercise->testCases === []) {
            $this->add($file, 'no_tests');
        }
    }

    /**
     * @param  array<string, mixed>  $attributes
     * @param  list<string>  $choices
     */
    private function checkChoice(string $file, array $attributes, string $field, array $choices): void
    {
        $value = $attributes[$field] ?? null;
        if ($value === null) {
            $this->add($file, 'required', ['field' => $field]);
        } elseif (! is_string($value) || ! in_array($value, $choices, true)) {
            $this->add($file, 'invalid_choice', [
                'field' => $field,
                'value' => is_scalar($value) ? (string) $value : '?',
                'allowed' => implode(', ', $choices),
            ]);
        }
    }

    /**
     * @param  array<string, mixed>  $attributes
     * @return list<string> az érvényes engedélyezett nyelvek
     */
    private function checkLanguages(string $file, array $attributes): array
    {
        $languages = $attributes['allowed_languages'] ?? null;
        if ($languages === null) {
            $this->add($file, 'required', ['field' => 'allowed_languages']);

            return [];
        }
        if (! is_array($languages) || ! array_is_list($languages) || $languages === []) {
            $this->add($file, 'invalid_type', ['field' => 'allowed_languages', 'expected' => 'nem üres nyelvlista']);

            return [];
        }

        $valid = [];
        foreach ($languages as $language) {
            if (is_string($language) && in_array($language, self::LANGUAGES, true)) {
                $valid[] = $language;
            } else {
                $this->add($file, 'invalid_choice', [
                    'field' => 'allowed_languages',
                    'value' => is_scalar($language) ? (string) $language : '?',
                    'allowed' => implode(', ', self::LANGUAGES),
                ]);
            }
        }

        return $valid;
    }

    /**
     * A `starter_code` / `sample_solutions` kulcsai az engedélyezett nyelvek részhalmaza, az értékek hossza korlátos.
     *
     * @param  array<string, mixed>  $attributes
     * @param  list<string>  $allowed
     */
    private function checkCodeMap(string $file, array $attributes, string $field, array $allowed, int $max): void
    {
        $map = $attributes[$field] ?? null;
        if ($map === null) {
            return;
        }
        if (! is_array($map) || ($map !== [] && array_is_list($map))) {
            $this->add($file, 'invalid_type', ['field' => $field, 'expected' => 'nyelv-kód párok']);

            return;
        }

        foreach ($map as $language => $code) {
            if (! in_array((string) $language, $allowed, true)) {
                $this->add($file, 'language_not_allowed', ['field' => $field, 'language' => (string) $language]);
            }
            if (! is_string($code)) {
                $this->add($file, 'invalid_type', ['field' => $field.'.'.$language, 'expected' => 'szöveg']);
            } elseif (mb_strlen($code) > $max) {
                $this->add($file, 'too_long', ['field' => $field.'.'.$language, 'max' => $max]);
            }
        }
    }

    /**
     * Kettős slug és kettős position egy szülőn belül; a hibát a későbbi fájlnál jelzi.
     *
     * @param  list<TrackNode|ModuleNode|LessonNode|ExerciseNode>  $siblings
     */
    private function checkSiblings(array $siblings): void
    {
        $slugs = [];
        $positions = [];
        foreach ($siblings as $node) {
            $slug = $node->attributes['slug'] ?? null;
            if (is_string($slug)) {
                if (isset($slugs[$slug])) {
                    $this->add($node->path, 'duplicate_slug', ['slug' => $slug, 'other' => $slugs[$slug]]);
                } else {
                    $slugs[$slug] = $node->path;
                }
            }

            $position = $node->attributes['position'] ?? null;
            if (is_int($position)) {
                if (isset($positions[$position])) {
                    $this->add($node->path, 'duplicate_position', ['position' => $position, 'other' => $positions[$position]]);
                } else {
                    $positions[$position] = $node->path;
                }
            }
        }
    }
}
