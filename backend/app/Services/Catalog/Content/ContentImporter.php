<?php

declare(strict_types=1);

namespace App\Services\Catalog\Content;

use App\Actions\Admin\Catalog\CreateExercise;
use App\Actions\Admin\Catalog\CreateLesson;
use App\Actions\Admin\Catalog\ManageCatalogItem;
use App\Actions\Admin\Catalog\ManageTestCase;
use App\Actions\Admin\Catalog\UpdateExercise;
use App\Actions\Admin\Catalog\UpdateLesson;
use App\Exceptions\DomainException;
use App\Models\Exercise;
use App\Models\Lesson;
use App\Models\Module;
use App\Models\TestCase;
use App\Models\Track;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * A beolvasott fa és a terv alkalmazása egyetlen adatbázis-tranzakcióban. Csak az admin felület
 * Actionjein át ír, így a publikálási kapuk és az audit napló ugyanúgy működik, mint a szerkesztőben.
 * Sorrend: track, modul, lecke, feladat, tesztesetek; a fájlokból eltűnt elemeket elrejti, soha nem törli.
 * Bármely elutasítás (pl. nyilvános teszteset nélküli publikált feladat) az egész importot visszagörgeti.
 */
final class ContentImporter
{
    private int $created = 0;

    private int $updated = 0;

    /** @var array<string, PlanEntry> */
    private array $actions = [];

    private User $actor;

    public function __construct(
        private readonly ManageCatalogItem $catalog,
        private readonly CreateLesson $createLesson,
        private readonly UpdateLesson $updateLesson,
        private readonly CreateExercise $createExercise,
        private readonly UpdateExercise $updateExercise,
        private readonly ManageTestCase $testCases,
    ) {}

    /**
     * @throws DomainException
     */
    public function apply(ContentSet $set, ImportPlan $plan, User $actor): ImportSummary
    {
        $this->created = 0;
        $this->updated = 0;
        $this->actor = $actor;
        $this->actions = [];
        foreach ($plan->entries as $entry) {
            $this->actions[$entry->kind.':'.$entry->path] = $entry;
        }

        return DB::transaction(function () use ($set, $plan): ImportSummary {
            foreach ($set->tracks as $trackNode) {
                $this->applyTrack($trackNode);
            }

            foreach ($plan->unpublish as $entry) {
                $this->unpublish($entry);
            }

            return new ImportSummary($this->created, $this->updated, count($plan->unpublish));
        });
    }

    private function applyTrack(TrackNode $node): void
    {
        $slug = $this->slug($node->attributes);
        $track = Track::query()->where('slug', $slug)->first();
        $entry = $this->actions['track:'.$slug] ?? null;

        if ($entry?->action === PlanEntry::CREATE) {
            $track = $this->catalog->create(new Track($node->attributes), null, $this->actor);
            $this->created++;
            $this->fixPosition($track, $node->attributes, null);
        } elseif ($entry?->action === PlanEntry::UPDATE && $track instanceof Track) {
            $this->catalog->update($track, $node->attributes, null, $this->actor);
            $this->updated++;
        }

        if (! $track instanceof Track) {
            return;
        }

        foreach ($node->modules as $moduleNode) {
            $this->applyModule($moduleNode, $track, $slug);
        }
    }

    private function applyModule(ModuleNode $node, Track $track, string $trackSlug): void
    {
        $slug = $this->slug($node->attributes);
        $path = $trackSlug.'/'.$slug;
        $module = Module::query()->where('track_id', $track->id)->where('slug', $slug)->first();
        $entry = $this->actions['module:'.$path] ?? null;

        if ($entry?->action === PlanEntry::CREATE) {
            $module = $this->catalog->create(new Module([...$node->attributes, 'track_id' => $track->id]), 'track_id', $this->actor);
            $this->created++;
            $this->fixPosition($module, $node->attributes, 'track_id');
        } elseif ($entry?->action === PlanEntry::UPDATE && $module instanceof Module) {
            $this->catalog->update($module, $node->attributes, 'track_id', $this->actor);
            $this->updated++;
        }

        if (! $module instanceof Module) {
            return;
        }

        foreach ($node->lessons as $lessonNode) {
            $this->applyLesson($lessonNode, $module, $path);
        }
    }

    private function applyLesson(LessonNode $node, Module $module, string $modulePath): void
    {
        $slug = $this->slug($node->attributes);
        $path = $modulePath.'/'.$slug;
        $lesson = Lesson::query()->where('module_id', $module->id)->where('slug', $slug)->first();
        $entry = $this->actions['lesson:'.$path] ?? null;
        $attributes = [...$node->attributes, 'content' => $node->content];

        if ($entry?->action === PlanEntry::CREATE) {
            $lesson = $this->createLesson->handle([...$attributes, 'module_id' => $module->id], $this->actor);
            $this->created++;
            $this->fixPosition($lesson, $attributes, 'module_id');
        } elseif ($entry?->action === PlanEntry::UPDATE && $lesson instanceof Lesson) {
            $this->updateLesson->handle($lesson, $attributes, $this->actor);
            $this->updated++;
        }

        if (! $lesson instanceof Lesson) {
            return;
        }

        foreach ($node->exercises as $exerciseNode) {
            $this->applyExercise($exerciseNode, $lesson, $path);
        }
    }

    private function applyExercise(ExerciseNode $node, Lesson $lesson, string $lessonPath): void
    {
        $slug = $this->slug($node->attributes);
        $entry = $this->actions['exercise:'.$lessonPath.'/'.$slug] ?? null;
        $attributes = $this->exerciseAttributes($node);

        if ($entry?->action === PlanEntry::CREATE) {
            // Előbb nem publikáltan: a publikálási kapu csak a tesztesetek felvétele után teljesülhet.
            $exercise = $this->createExercise->handle(
                [...$attributes, 'lesson_id' => $lesson->id, 'is_published' => false],
                $this->actor,
            );
            $this->created++;
            $this->replaceTests($exercise, $node);
            if (($attributes['is_published'] ?? false) === true) {
                $this->updateExercise->handle($exercise, ['is_published' => true], $this->actor);
            }
            $this->fixPosition($exercise, $attributes, 'lesson_id');

            return;
        }

        if ($entry?->action !== PlanEntry::UPDATE) {
            return;
        }

        $exercise = $this->findExercise($lesson, $slug);
        if (! $exercise instanceof Exercise) {
            return;
        }

        if (in_array('tests', $entry->changedFields, true)) {
            $this->replaceTests($exercise, $node);
        }
        if (array_diff($entry->changedFields, ['tests']) !== []) {
            $this->updateExercise->handle($exercise, $attributes, $this->actor);
        }
        $this->updated++;
    }

    /**
     * A feladat tesztesetei a fájl sorrendjében: előbb az újak jönnek létre, aztán a régiek törlődnek,
     * így a publikált feladatnak végig marad nyilvános tesztesete (ha az újak között nincs, az Action elutasít).
     */
    private function replaceTests(Exercise $exercise, ExerciseNode $node): void
    {
        $old = TestCase::query()->where('exercise_id', $exercise->id)->orderBy('id')->get();

        foreach ($node->testCases as $case) {
            $this->testCases->create($exercise, [
                'stdin' => $case['stdin'],
                'expected_stdout' => $case['expected_stdout'],
                'is_hidden' => $case['is_hidden'],
            ], $this->actor);
        }

        foreach ($old as $testCase) {
            $this->testCases->delete($testCase, $this->actor);
        }
    }

    private function unpublish(PlanEntry $entry): void
    {
        $segments = explode('/', $entry->path);
        $lesson = Lesson::query()
            ->where('slug', $segments[2] ?? '')
            ->whereHas('module', fn ($module) => $module->where('slug', $segments[1] ?? '')
                ->whereHas('track', fn ($track) => $track->where('slug', $segments[0])))
            ->first();
        if (! $lesson instanceof Lesson) {
            return;
        }

        if ($entry->kind === 'lesson') {
            $this->updateLesson->handle($lesson, ['is_published' => false], $this->actor);

            return;
        }

        $exercise = $this->findExercise($lesson, $segments[3] ?? '');
        if ($exercise instanceof Exercise) {
            $this->updateExercise->handle($exercise, ['is_published' => false], $this->actor);
        }
    }

    private function findExercise(Lesson $lesson, string $slug): ?Exercise
    {
        foreach ($lesson->exercises()->get() as $exercise) {
            if (Str::slug($exercise->title) === $slug) {
                return $exercise;
            }
        }

        return null;
    }

    /**
     * A fájl attribútumai az Action számára: a `slug` nem adatbázis-mező, a `limits` két oszlopra bomlik.
     *
     * @return array<string, mixed>
     */
    private function exerciseAttributes(ExerciseNode $node): array
    {
        $attributes = $node->attributes;
        unset($attributes['slug'], $attributes['limits']);

        $limits = $node->attributes['limits'] ?? null;
        if (is_array($limits)) {
            foreach (['time_limit_ms', 'memory_limit_kb'] as $key) {
                if (array_key_exists($key, $limits)) {
                    $attributes[$key] = $limits[$key];
                }
            }
        }

        return $attributes;
    }

    /**
     * A létrehozó Action a szülő végére teszi az elemet; ha a fájl más sorszámot ad, azt ráírjuk.
     *
     * @param  array<string, mixed>  $attributes
     */
    private function fixPosition(Track|Module|Lesson|Exercise $item, array $attributes, ?string $parentKey): void
    {
        $position = $attributes['position'] ?? null;
        if (! is_int($position) || $item->position === $position) {
            return;
        }

        match (true) {
            $item instanceof Lesson => $this->updateLesson->handle($item, ['position' => $position], $this->actor),
            $item instanceof Exercise => $this->updateExercise->handle($item, ['position' => $position], $this->actor),
            default => $this->catalog->update($item, ['position' => $position], $parentKey, $this->actor),
        };
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    private function slug(array $attributes): string
    {
        $slug = $attributes['slug'] ?? '';

        return is_string($slug) ? $slug : '';
    }
}
