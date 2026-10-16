<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Actions\Audit\RecordAuditEvent;
use App\Enums\AuditAction;
use App\Enums\Role;
use App\Exceptions\DomainException;
use App\Models\User;
use App\Services\Catalog\Content\ContentImporter;
use App\Services\Catalog\Content\ContentPlanner;
use App\Services\Catalog\Content\ContentProblem;
use App\Services\Catalog\Content\ContentReader;
use App\Services\Catalog\Content\ContentSet;
use App\Services\Catalog\Content\ContentValidator;
use App\Services\Catalog\Content\ImportPlan;
use App\Services\Catalog\Content\LessonNode;
use App\Services\Catalog\Content\ModuleNode;
use App\Services\Catalog\Content\PlanEntry;
use App\Services\Catalog\Content\TrackNode;
use Illuminate\Console\Command;

class ImportCatalogCommand extends Command
{
    protected $signature = 'catalog:import
        {--dry-run : Csak beolvas és ellenőriz, nem ír az adatbázisba}
        {--path=content/catalog : A tartalmi könyvtár (a repó gyökeréhez képest, vagy abszolút)}
        {--only= : Útvonal-előtag: <track>[/<modul>[/<lecke>]] (slugok)}';

    protected $description = 'A tartalmi fájlok (Markdown/YAML) beolvasása, ellenőrzése és importálása a katalógusba';

    public function handle(
        ContentReader $reader,
        ContentValidator $validator,
        ContentPlanner $planner,
        ContentImporter $importer,
        RecordAuditEvent $audit,
    ): int {
        $actor = null;
        if (! $this->option('dry-run')) {
            $actor = User::query()->where('role', Role::Admin)->orderBy('id')->first();
            if (! $actor instanceof User) {
                $this->error((string) __('catalog_import.no_admin'));

                return self::FAILURE;
            }
        }

        $set = $reader->read($this->resolveRoot());
        $only = $this->only();
        if ($only !== []) {
            $set = $this->filter($set, $only);
        }

        if ($only !== [] && $this->matchCount($set, count($only)) === 0 && $set->problems === []) {
            $this->error((string) __('catalog_import.no_match', ['only' => implode('/', $only)]));

            return self::FAILURE;
        }

        $problems = $validator->problems($set);
        if ($problems !== []) {
            $this->error((string) __('catalog_import.problems_header', ['count' => count($problems)]));
            foreach ($problems as $problem) {
                $this->line($problem->line());
            }

            return self::FAILURE;
        }

        $plan = $planner->plan($set, $only);

        if ($actor instanceof User) {
            return $this->import($importer, $audit, $set, $plan, $actor);
        }

        $this->info((string) __('catalog_import.summary', [
            'lessons' => $plan->count('lesson', PlanEntry::CREATE),
            'exercises' => $plan->count('exercise', PlanEntry::CREATE),
        ]));
        foreach ($this->lessons($set) as $lesson) {
            $this->line((string) __('catalog_import.body_length', [
                'path' => dirname($lesson->path),
                'length' => mb_strlen($lesson->content),
            ]));
        }
        foreach ([...$plan->entries, ...$plan->unpublish] as $entry) {
            $this->line((string) __('catalog_import.plan_'.$entry->action, [
                'kind' => __('catalog_import.kind_'.$entry->kind),
                'path' => $entry->path,
                'fields' => implode(', ', $entry->changedFields),
            ]));
        }

        return self::SUCCESS;
    }

    private function import(ContentImporter $importer, RecordAuditEvent $audit, ContentSet $set, ImportPlan $plan, User $actor): int
    {
        try {
            $summary = $importer->apply($set, $plan, $actor);
        } catch (DomainException $e) {
            $this->error((string) __('catalog_import.import_failed', ['message' => $e->getMessage()]));

            return self::FAILURE;
        }

        if ($summary->total() > 0) {
            $audit->handle(AuditAction::CatalogImported, $actor, null, [
                'created' => $summary->created,
                'updated' => $summary->updated,
                'unpublished' => $summary->unpublished,
            ]);
        }

        $this->info((string) __('catalog_import.applied', [
            'created' => $summary->created,
            'updated' => $summary->updated,
            'unpublished' => $summary->unpublished,
        ]));

        return self::SUCCESS;
    }

    /** Hány track (1), modul (2) vagy lecke (3) maradt az `--only` szűrő után. */
    private function matchCount(ContentSet $set, int $depth): int
    {
        $count = 0;
        foreach ($set->tracks as $track) {
            if ($depth === 1) {
                $count++;

                continue;
            }
            foreach ($track->modules as $module) {
                $count += $depth === 2 ? 1 : count($module->lessons);
            }
        }

        return $count;
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
