<?php

declare(strict_types=1);

namespace App\Services\Catalog\Content;

use App\Models\Exercise;
use App\Models\Lesson;
use App\Models\Module;
use App\Models\Track;
use App\Services\Constraints\ConstraintSet;
use Illuminate\Support\Str;
use Throwable;

/**
 * Összeveti a beolvasott fát az adatbázissal; nem ír semmit.
 * Azonosítás: track/modul/lecke a (szülő, slug) párral; a feladatnak nincs slug oszlopa,
 * ezért a (lecke, Str::slug(cím)) párral.
 */
final class ContentPlanner
{
    /** @var list<PlanEntry> */
    private array $entries = [];

    /** @var list<PlanEntry> */
    private array $unpublish = [];

    /**
     * @param  list<string>  $only  az `--only` útvonal-előtag slugjai: az elrejtés csak ezen belül számít
     */
    public function plan(ContentSet $set, array $only = []): ImportPlan
    {
        $this->entries = [];
        $this->unpublish = [];

        $slugs = [];
        foreach ($set->tracks as $track) {
            $slugs[] = $this->slug($track->attributes);
        }

        $existing = Track::query()
            ->with('modules.lessons.exercises.testCases')
            ->whereIn('slug', $slugs)
            ->get()
            ->keyBy('slug');

        foreach ($set->tracks as $trackNode) {
            $this->planTrack($trackNode, $existing->get($this->slug($trackNode->attributes)), $only);
        }

        return new ImportPlan($this->entries, $this->unpublish);
    }

    /**
     * @param  list<string>  $only
     */
    private function planTrack(TrackNode $node, ?Track $track, array $only): void
    {
        $trackSlug = $this->slug($node->attributes);
        $this->add('track', $trackSlug, $track === null ? null : $this->diff($node->attributes, [
            'title' => $track->title,
            'description' => $track->description,
            'position' => $track->position,
            'is_published' => $track->is_published,
        ]));

        /** @var array<string, Module> $modules */
        $modules = [];
        foreach ($track === null ? [] : $track->modules as $existing) {
            $modules[$existing->slug] = $existing;
        }
        foreach ($node->modules as $moduleNode) {
            $moduleSlug = $this->slug($moduleNode->attributes);
            $module = $modules[$moduleSlug] ?? null;
            $path = $trackSlug.'/'.$moduleSlug;
            $this->add('module', $path, $module === null ? null : $this->diff($moduleNode->attributes, [
                'title' => $module->title,
                'description' => $module->description,
                'position' => $module->position,
            ]));
            $this->planModule($moduleNode, $module, $path, $only);
        }
    }

    /**
     * @param  list<string>  $only
     */
    private function planModule(ModuleNode $node, ?Module $module, string $path, array $only): void
    {
        /** @var array<string, Lesson> $lessons */
        $lessons = [];
        foreach ($module === null ? [] : $module->lessons as $existing) {
            $lessons[$existing->slug] = $existing;
        }
        $seen = [];
        foreach ($node->lessons as $lessonNode) {
            $slug = $this->slug($lessonNode->attributes);
            $seen[] = $slug;
            $lesson = $lessons[$slug] ?? null;
            $lessonPath = $path.'/'.$slug;
            $this->add('lesson', $lessonPath, $lesson === null ? null : $this->diff(
                [...$lessonNode->attributes, 'content' => $lessonNode->content],
                [
                    'title' => $lesson->title,
                    'position' => $lesson->position,
                    'is_free' => $lesson->is_free,
                    'is_published' => $lesson->is_published,
                    'content' => $lesson->content,
                ],
            ));
            $this->planLesson($lessonNode, $lesson, $lessonPath, $only);
        }

        foreach ($lessons as $slug => $lesson) {
            if (! in_array($slug, $seen, true) && $lesson->is_published && $this->inScope($path.'/'.$slug, $only)) {
                $this->unpublish[] = new PlanEntry('lesson', $path.'/'.$slug, PlanEntry::UNPUBLISH);
            }
        }
    }

    /**
     * @param  list<string>  $only
     */
    private function planLesson(LessonNode $node, ?Lesson $lesson, string $path, array $only): void
    {
        /** @var array<string, Exercise> $exercises */
        $exercises = [];
        if ($lesson !== null) {
            foreach ($lesson->exercises as $exercise) {
                $exercises[Str::slug($exercise->title)] = $exercise;
            }
        }

        $seen = [];
        foreach ($node->exercises as $exerciseNode) {
            $slug = $this->slug($exerciseNode->attributes);
            $seen[] = $slug;
            $exercise = $exercises[$slug] ?? null;
            $this->add('exercise', $path.'/'.$slug, $exercise === null ? null : $this->diffExercise($exerciseNode, $exercise));
        }

        foreach ($exercises as $slug => $exercise) {
            if (! in_array($slug, $seen, true) && $exercise->is_published && $this->inScope($path.'/'.$slug, $only)) {
                $this->unpublish[] = new PlanEntry('exercise', $path.'/'.$slug, PlanEntry::UNPUBLISH);
            }
        }
    }

    /**
     * @return list<string>
     */
    private function diffExercise(ExerciseNode $node, Exercise $exercise): array
    {
        $db = [
            'title' => $exercise->title,
            'position' => $exercise->position,
            'kind' => $exercise->kind->value,
            'level' => $exercise->level,
            'difficulty' => $exercise->difficulty,
            'is_published' => $exercise->is_published,
            'allowed_languages' => $exercise->allowed_languages,
            'description' => $exercise->description,
            'starter_code' => $exercise->starter_code,
            'sample_solutions' => $exercise->sample_solutions,
            'sql_order_sensitive' => $exercise->sql_order_sensitive,
        ];

        $file = $node->attributes;
        unset($file['slug'], $file['constraints'], $file['limits']);

        $limits = $node->attributes['limits'] ?? null;
        if (is_array($limits)) {
            $db['time_limit_ms'] = $exercise->time_limit_ms;
            $db['memory_limit_kb'] = $exercise->memory_limit_kb;
            foreach (['time_limit_ms', 'memory_limit_kb'] as $key) {
                if (array_key_exists($key, $limits)) {
                    $file[$key] = $limits[$key];
                }
            }
        }

        $changed = $this->diff($file, $db);

        if (array_key_exists('constraints', $node->attributes)
            && $this->constraints($node->attributes['constraints']) !== $exercise->constraints->toArray()) {
            $changed[] = 'constraints';
        }

        $tests = [];
        foreach ($exercise->testCases as $case) {
            $tests[] = [
                'stdin' => $case->stdin,
                'expected_stdout' => $case->expected_stdout,
                'is_hidden' => $case->is_hidden,
                'order' => $case->order,
            ];
        }
        if ($this->canonical($tests) !== $this->canonical($node->testCases)) {
            $changed[] = 'tests';
        }

        return $changed;
    }

    /**
     * @return array<array-key, mixed>
     */
    private function constraints(mixed $value): array
    {
        try {
            return is_array($value) ? ConstraintSet::fromArray($value)->toArray() : [];
        } catch (Throwable) {
            return ['invalid' => true];
        }
    }

    /**
     * A fájlban megadott mezők összevetése az adatbázis értékeivel (a nem megadott mező nem számít).
     *
     * @param  array<string, mixed>  $file
     * @param  array<string, mixed>  $db
     * @return list<string>
     */
    private function diff(array $file, array $db): array
    {
        $changed = [];
        foreach ($db as $field => $current) {
            if (array_key_exists($field, $file) && $this->canonical($file[$field]) !== $this->canonical($current)) {
                $changed[] = $field;
            }
        }

        return $changed;
    }

    /** Típushelyes, kulcssorrend-független összehasonlítási alak; az üres szöveg és a null azonos. */
    private function canonical(mixed $value): mixed
    {
        if (is_array($value)) {
            $mapped = array_map(fn (mixed $item): mixed => $this->canonical($item), $value);
            if (! array_is_list($mapped)) {
                ksort($mapped);
            }

            return $mapped;
        }

        return $value === '' ? null : $value;
    }

    /**
     * @param  list<string>|null  $changed  null: nincs még az adatbázisban
     */
    private function add(string $kind, string $path, ?array $changed): void
    {
        $this->entries[] = match (true) {
            $changed === null => new PlanEntry($kind, $path, PlanEntry::CREATE),
            $changed === [] => new PlanEntry($kind, $path, PlanEntry::UNCHANGED),
            default => new PlanEntry($kind, $path, PlanEntry::UPDATE, $changed),
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

    /**
     * @param  list<string>  $only
     */
    private function inScope(string $path, array $only): bool
    {
        $segments = explode('/', $path);
        foreach ($only as $depth => $slug) {
            if (isset($segments[$depth]) && $segments[$depth] !== $slug) {
                return false;
            }
        }

        return true;
    }
}
