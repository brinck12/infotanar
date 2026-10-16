<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Services\Catalog\Content\ContentProblem;
use App\Services\Catalog\Content\ContentReader;
use App\Services\Catalog\Content\ContentSet;
use App\Services\Catalog\Content\ContentValidator;
use App\Services\Catalog\Content\LessonNode;
use App\Services\Catalog\Content\ModuleNode;
use App\Services\Catalog\Content\TrackNode;
use Illuminate\Console\Command;

class ImportCatalogCommand extends Command
{
    protected $signature = 'catalog:import
        {--dry-run : Csak beolvas és ellenőriz, nem ír az adatbázisba}
        {--path=content/catalog : A tartalmi könyvtár (a repó gyökeréhez képest, vagy abszolút)}
        {--only= : Útvonal-előtag: <track>[/<modul>[/<lecke>]] (slugok)}';

    protected $description = 'A tartalmi fájlok (Markdown/YAML) beolvasása és ellenőrzése a katalógushoz';

    public function handle(ContentReader $reader, ContentValidator $validator): int
    {
        if (! $this->option('dry-run')) {
            $this->error((string) __('catalog_import.live_not_available'));

            return self::FAILURE;
        }

        $set = $reader->read($this->resolveRoot());
        $only = $this->only();
        if ($only !== []) {
            $set = $this->filter($set, $only);
        }

        $problems = $validator->problems($set);
        if ($problems !== []) {
            $this->error((string) __('catalog_import.problems_header', ['count' => count($problems)]));
            foreach ($problems as $problem) {
                $this->line($problem->line());
            }

            return self::FAILURE;
        }

        $lessons = $this->lessons($set);
        $exercises = array_sum(array_map(static fn (LessonNode $lesson): int => count($lesson->exercises), $lessons));

        $this->info((string) __('catalog_import.summary', ['lessons' => count($lessons), 'exercises' => $exercises]));
        foreach ($lessons as $lesson) {
            $this->line((string) __('catalog_import.body_length', [
                'path' => dirname($lesson->path),
                'length' => mb_strlen($lesson->content),
            ]));
        }

        return self::SUCCESS;
    }

    private function resolveRoot(): string
    {
        $path = (string) $this->option('path');
        if (preg_match('#^([A-Za-z]:[\\\\/]|[\\\\/])#', $path) === 1) {
            return $path;
        }

        return base_path('..').'/'.$path;
    }

    /**
     * @return list<string>
     */
    private function only(): array
    {
        $only = trim((string) $this->option('only'), '/');

        return $only === '' ? [] : explode('/', $only);
    }

    /**
     * Az `--only` szűrő: a track/modul/lecke slugok előtagja; a beolvasási hibák a mappanevek (sorszám nélkül) szerint.
     *
     * @param  list<string>  $only
     */
    private function filter(ContentSet $set, array $only): ContentSet
    {
        $tracks = [];
        foreach ($set->tracks as $track) {
            if (! $this->matches($track->attributes['slug'] ?? null, $only, 0)) {
                continue;
            }

            $modules = [];
            foreach ($track->modules as $module) {
                if (! $this->matches($module->attributes['slug'] ?? null, $only, 1)) {
                    continue;
                }

                $lessons = array_values(array_filter(
                    $module->lessons,
                    fn (LessonNode $lesson): bool => $this->matches($lesson->attributes['slug'] ?? null, $only, 2),
                ));
                $modules[] = new ModuleNode($module->path, $module->attributes, $lessons);
            }
            $tracks[] = new TrackNode($track->path, $track->attributes, $modules);
        }

        $problems = array_values(array_filter(
            $set->problems,
            fn (ContentProblem $problem): bool => $this->problemMatches($problem->file, $only),
        ));

        return new ContentSet($tracks, $problems);
    }

    /**
     * @param  list<string>  $only
     */
    private function matches(mixed $slug, array $only, int $depth): bool
    {
        return ! isset($only[$depth]) || $slug === $only[$depth];
    }

    /**
     * @param  list<string>  $only
     */
    private function problemMatches(string $file, array $only): bool
    {
        $segments = array_map(
            static fn (string $segment): string => (string) preg_replace('/^\d+-/', '', $segment),
            explode('/', $file),
        );

        foreach ($only as $depth => $slug) {
            if (isset($segments[$depth]) && $segments[$depth] !== $slug) {
                return false;
            }
        }

        return true;
    }

    /**
     * @return list<LessonNode>
     */
    private function lessons(ContentSet $set): array
    {
        $lessons = [];
        foreach ($set->tracks as $track) {
            foreach ($track->modules as $module) {
                foreach ($module->lessons as $lesson) {
                    $lessons[] = $lesson;
                }
            }
        }

        return $lessons;
    }
}
