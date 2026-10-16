<?php

declare(strict_types=1);

namespace App\Services\Catalog\Content;

use App\Models\Exercise;
use App\Models\Lesson;
use App\Models\Module;
use App\Models\Track;
use Illuminate\Support\Str;
use Symfony\Component\Yaml\Exception\ParseException;
use Symfony\Component\Yaml\Yaml;

/**
 * Az adatbázis tartalmának kiírása a `ContentReader` fájlformátumába (az import fordítottja).
 * Mappanevek: track = slug, modul és lecke = `NN-slug`, ahol NN = position + 1 (a szerzői fixture-ök szerint 1-től; a testvérek közül a legnagyobb
 * sorszám jegyszámához igazítva, legalább 2 jegyű), feladat = `NN-<Str::slug(cím)>.yml`.
 * Csak szerkesztős (`code`, `sql`) feladatot ír; a többit kihagyja és jelzi (`skipped()`).
 * Ír előtt, memóriában minden fájlról ellenőrzi, hogy a beolvasás szó szerint ugyanazt adja vissza
 * (YAML-adat, CR nélküli Markdown-törzs), és hogy a feladat-fájlnevek és slugok egyediek; hiba esetén semmi nem íródik.
 */
final class ContentExporter
{
    /** @var list<string> */
    private array $skipped = [];

    /** @var list<string> */
    private array $warnings = [];

    /** @var list<string> */
    private array $collisions = [];

    public function __construct(private readonly ContentReader $reader) {}

    /**
     * @param  list<string>  $only  útvonal-előtag slugjai: <track>[/<modul>[/<lecke>]]
     * @return list<string> a kiírt fájlok relatív útvonala
     *
     * @throws ContentExportException
     */
    public function export(string $root, bool $force, array $only = []): array
    {
        $this->skipped = [];
        $this->warnings = [];
        $this->collisions = [];
        $root = rtrim($root, '/\\');

        $files = $this->collect($root, $force, $only);

        if (! $force) {
            $existing = array_values(array_filter(array_keys($files), static fn (string $rel): bool => file_exists($root.'/'.$rel)));
            if ($existing !== []) {
                throw new ContentExportException((string) __('catalog_import.export_conflict'), $existing);
            }
        }

        foreach ($files as $rel => $content) {
            $path = $root.'/'.$rel;
            $dir = dirname($path);
            if (! is_dir($dir) && ! mkdir($dir, 0775, true) && ! is_dir($dir)) {
                throw new ContentExportException((string) __('catalog_import.export_unwritable', ['path' => $rel]));
            }
            if (file_put_contents($path, $content) === false) {
                throw new ContentExportException((string) __('catalog_import.export_unwritable', ['path' => $rel]));
            }
        }

        return array_keys($files);
    }

    /**
     * Az utolsó `export()` figyelmeztetései (pl. nem megőrizhető felülvizsgálati jelölések).
     *
     * @return list<string>
     */
    public function warnings(): array
    {
        return $this->warnings;
    }

    /**
     * Az utolsó `export()` által kihagyott feladatok (útvonal és fajta).
     *
     * @return list<string>
     */
    public function skipped(): array
    {
        return $this->skipped;
    }

    /**
     * @param  list<string>  $only
     * @return array<string, string> relatív útvonal => tartalom
     *
     * @throws ContentExportException
     */
    private function collect(string $root, bool $force, array $only): array
    {
        $files = [];
        $tracks = Track::query()
            ->with('modules.lessons.exercises.testCases')
            ->orderBy('position')
            ->orderBy('id')
            ->get();

        foreach ($tracks as $track) {
            if (! $this->matches($track->slug, $only, 0)) {
                continue;
            }
            $trackDir = $track->slug;
            $files[$trackDir.'/_track.yml'] = $this->yaml($trackDir.'/_track.yml', $this->described([
                'slug' => $track->slug,
                'title' => $track->title,
            ], $track->description) + ['position' => $track->position, 'published' => $track->is_published]);

            $moduleWidth = $this->width($track->modules->pluck('position')->all());
            foreach ($track->modules as $module) {
                if ($this->matches($module->slug, $only, 1)) {
                    $files += $this->collectModule($root, $force, $only, $trackDir, $module, $moduleWidth);
                }
            }
        }

        if ($this->collisions !== []) {
            throw new ContentExportException((string) __('catalog_import.export_collision'), array_values(array_unique($this->collisions)));
        }

        return $files;
    }

    /**
     * @param  list<string>  $only
     * @return array<string, string>
     */
    private function collectModule(string $root, bool $force, array $only, string $trackDir, Module $module, int $width): array
    {
        $dir = $trackDir.'/'.$this->numbered($module->position, $width, $module->slug);
        $files = [$dir.'/_module.yml' => $this->yaml($dir.'/_module.yml', $this->described([
            'slug' => $module->slug,
            'title' => $module->title,
        ], $module->description) + ['position' => $module->position])];

        $lessonWidth = $this->width($module->lessons->pluck('position')->all());
        foreach ($module->lessons as $lesson) {
            if ($this->matches($lesson->slug, $only, 2)) {
                $files += $this->collectLesson($root, $force, $dir, $lesson, $lessonWidth, $trackDir.'/'.$module->slug);
            }
        }

        return $files;
    }

    /**
     * @return array<string, string>
     */
    private function collectLesson(string $root, bool $force, string $moduleDir, Lesson $lesson, int $width, string $slugPath): array
    {
        $dir = $moduleDir.'/'.$this->numbered($lesson->position, $width, $lesson->slug);
        $files = [$dir.'/lesson.md' => $this->lessonFile($root, $force, $dir, $lesson)];

        $exerciseWidth = $this->width($lesson->exercises->pluck('position')->all());
        $seen = [];
        foreach ($lesson->exercises as $exercise) {
            $slug = Str::slug($exercise->title);
            if (! $exercise->kind->isEditorBased()) {
                $this->skipped[] = (string) __('catalog_import.export_skipped', [
                    'path' => $slugPath.'/'.$lesson->slug.'/'.$slug,
                    'kind' => $exercise->kind->value,
                ]);

                continue;
            }
            $label = $slugPath.'/'.$lesson->slug.' – '.$exercise->title;
            $rel = $dir.'/exercises/'.$this->numbered($exercise->position, $exerciseWidth, $slug).'.yml';
            if ($slug === '' || isset($seen[$slug]) || isset($files[$rel])) {
                $this->collisions[] = $label;
                if (isset($seen[$slug])) {
                    $this->collisions[] = $seen[$slug];
                }

                continue;
            }
            $seen[$slug] = $label;
            $files[$rel] = $this->yaml($rel, $this->exerciseData($exercise, $slug));
        }

        return $files;
    }

    private function lessonFile(string $root, bool $force, string $dir, Lesson $lesson): string
    {
        if (str_contains((string) $lesson->content, chr(13))) {
            throw new ContentExportException((string) __('catalog_import.export_lossy', ['path' => $dir.'/lesson.md']));
        }

        $stamps = ['by' => null, 'at' => null];
        if ($force && is_file($root.'/'.$dir.'/lesson.md')) {
            $read = $this->reader->reviewStamps($root.'/'.$dir);
            if ($read === null) {
                $this->warnings[] = (string) __('catalog_import.export_stamps_lost', ['path' => $dir.'/lesson.md']);
            } else {
                $stamps = $read;
            }
        }

        $header = $this->yaml($dir.'/lesson.md', [
            'slug' => $lesson->slug,
            'title' => $lesson->title,
            'position' => $lesson->position,
            'free' => $lesson->is_free,
            'published' => $lesson->is_published,
            'reviewed_by' => $stamps['by'],
            'reviewed_at' => $stamps['at'],
        ]);
        // Üres jelölés: üres érték (mint a kézzel írt fájlokban), nem „null”.
        $header = (string) preg_replace('/^(reviewed_(?:by|at)): null$/m', '$1:', $header);

        // A reader a fejlécet az első önálló `---` sorig olvassa, a törzs a maradék, szó szerint.
        return "---\n".$header."---\n".$lesson->content;
    }

    /**
     * @return array<string, mixed>
     */
    private function exerciseData(Exercise $exercise, string $slug): array
    {
        $data = [
            'slug' => $slug,
            'title' => $exercise->title,
            'position' => $exercise->position,
            'kind' => $exercise->kind->value,
            'level' => $exercise->level,
            'difficulty' => $exercise->difficulty,
            'published' => $exercise->is_published,
            'allowed_languages' => $exercise->allowed_languages ?? [],
            'description' => $exercise->description,
        ];

        $starter = $this->codeMap($exercise->starter_code);
        if ($starter !== []) {
            $data['starter_code'] = $starter;
        }
        $solutions = $this->codeMap($exercise->sample_solutions);
        if ($solutions !== []) {
            $data['sample_solutions'] = $solutions;
        }

        if (! $exercise->constraints->isEmpty()) {
            $data['constraints'] = array_filter($exercise->constraints->toArray(), static fn (array $list): bool => $list !== []);
        }
        if ($exercise->sql_order_sensitive || $exercise->kind->value === 'sql') {
            $data['sql_order_sensitive'] = $exercise->sql_order_sensitive;
        }

        $limits = array_filter([
            'time_limit_ms' => $exercise->time_limit_ms,
            'memory_limit_kb' => $exercise->memory_limit_kb,
        ], static fn (?int $value): bool => $value !== null);
        if ($limits !== []) {
            $data['limits'] = $limits;
        }

        $tests = [];
        foreach ($exercise->testCases as $case) {
            $tests[] = ['stdin' => $case->stdin, 'expected' => $case->expected_stdout, 'hidden' => $case->is_hidden];
        }
        $data['tests'] = $tests;

        return $data;
    }

    /**
     * @param  array<string, string|null>|null  $map
     * @return array<string, string>
     */
    private function codeMap(?array $map): array
    {
        $out = [];
        foreach ($map ?? [] as $language => $code) {
            if ($code !== null) {
                $out[(string) $language] = $code;
            }
        }

        return $out;
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function described(array $data, ?string $description): array
    {
        if ($description !== null && $description !== '') {
            $data['description'] = $description;
        }

        return $data;
    }

    /**
     * YAML kiírás: a többsoros szöveg literal blokk (`|`). Ha egy fájl így nem olvasható vissza pontosan
     * (a reader a `\r`-t `\n`-re egységesíti), idézőjeles skalárokkal próbálja újra.
     *
     * @param  array<string, mixed>  $data
     *
     * @throws ContentExportException
     */
    private function yaml(string $rel, array $data): string
    {
        foreach ([Yaml::DUMP_MULTI_LINE_LITERAL_BLOCK, 0] as $flags) {
            $yaml = Yaml::dump($data, 10, 2, $flags);
            if ($this->survives($yaml, $data)) {
                return $yaml;
            }
        }

        throw new ContentExportException((string) __('catalog_import.export_lossy', ['path' => $rel]));
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function survives(string $yaml, array $data): bool
    {
        try {
            $parsed = Yaml::parse(str_replace(["\r\n", "\r"], "\n", $yaml), Yaml::PARSE_DATETIME);
        } catch (ParseException) {
            return false;
        }

        return $parsed === $data;
    }

    /**
     * @param  list<string>  $only
     */
    private function matches(string $slug, array $only, int $depth): bool
    {
        return ! isset($only[$depth]) || $only[$depth] === $slug;
    }

    /**
     * @param  array<array-key, mixed>  $positions
     */
    private function width(array $positions): int
    {
        $max = 0;
        foreach ($positions as $position) {
            if (is_int($position)) {
                $max = max($max, $position + 1);
            }
        }

        return max(2, strlen((string) $max));
    }

    private function numbered(int $position, int $width, string $slug): string
    {
        return str_pad((string) ($position + 1), $width, '0', STR_PAD_LEFT).'-'.$slug;
    }
}
