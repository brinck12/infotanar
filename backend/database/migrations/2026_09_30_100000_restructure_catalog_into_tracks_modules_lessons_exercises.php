<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

/**
 * ADR (#21): a lapos Topic -> Task -> TestCase hierarchiat a PRD negyszintu
 * katalogusara alakitjuk: Track -> Module -> Lesson -> Exercise (-> TestCase).
 *
 *  - topics    -> modules   (name -> title; uj: track_id, description, position)
 *  - uj tracks tabla; minden meglevo modul a "Programozás" trackbe kerul
 *  - uj lessons tabla; minden meglevo feladat sajat leckét kap (1:1), a lecke
 *    cime a feladat cime, a tananyag (content) kesobb tolheto fel
 *  - tasks     -> exercises (topic_id helyett lesson_id + position)
 *  - test_cases.task_id, submissions.task_id -> exercise_id
 *
 * A meglevo adat (feladatok, tesztesetek, beadasok) nem veszik el. A
 * v1 API szerzodese (/topics, /tasks, task_id) valtozatlan marad.
 */
return new class extends Migration
{
    private const DEFAULT_TRACK_SLUG = 'programozas';

    public function up(): void
    {
        Schema::create('tracks', function (Blueprint $table): void {
            $table->id();
            $table->string('slug')->unique();
            $table->string('title');
            $table->text('description')->nullable();
            $table->unsignedInteger('position')->default(0);
            $table->boolean('is_published')->default(true);
            $table->timestamps();
        });

        $trackId = DB::table('tracks')->insertGetId([
            'slug' => self::DEFAULT_TRACK_SLUG,
            'title' => 'Programozás',
            'description' => 'Programozási tételek és feladatok Python és C# nyelven.',
            'position' => 0,
            'is_published' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->topicsToModules($trackId);
        $this->createLessons();
        $this->tasksToExercises();
        $this->repointChildren('test_cases', 'order');
        $this->repointChildren('submissions', 'created_at');
    }

    public function down(): void
    {
        $this->restoreChildren('submissions', 'created_at');
        $this->restoreChildren('test_cases', 'order');
        $this->exercisesToTasks();
        Schema::dropIfExists('lessons');
        $this->modulesToTopics();

        // Csak most, amikor a topics tabla ujra letezik.
        Schema::table('tasks', function (Blueprint $table): void {
            $table->foreign('topic_id')->references('id')->on('topics')->cascadeOnDelete();
        });

        Schema::dropIfExists('tracks');
    }

    private function topicsToModules(int $trackId): void
    {
        Schema::rename('topics', 'modules');

        Schema::table('modules', function (Blueprint $table): void {
            $table->renameColumn('name', 'title');
        });

        Schema::table('modules', function (Blueprint $table): void {
            $table->foreignId('track_id')->nullable()->after('id');
            $table->text('description')->nullable()->after('slug');
            $table->unsignedInteger('position')->default(0)->after('description');
        });

        foreach (DB::table('modules')->orderBy('id')->pluck('id') as $position => $moduleId) {
            DB::table('modules')->where('id', $moduleId)->update(['track_id' => $trackId, 'position' => $position]);
        }

        Schema::table('modules', function (Blueprint $table): void {
            $table->foreignId('track_id')->nullable(false)->change();
            $table->foreign('track_id')->references('id')->on('tracks')->cascadeOnDelete();
            $table->index(['track_id', 'position']);
        });
    }

    private function createLessons(): void
    {
        Schema::create('lessons', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('module_id')->constrained()->cascadeOnDelete();
            $table->string('slug');
            $table->string('title');
            $table->longText('content')->nullable();
            $table->unsignedInteger('position')->default(0);
            $table->boolean('is_published')->default(true);
            $table->timestamps();

            $table->unique(['module_id', 'slug']);
            $table->index(['module_id', 'position']);
        });
    }

    private function tasksToExercises(): void
    {
        Schema::table('tasks', function (Blueprint $table): void {
            $table->dropForeign(['topic_id']);
        });
        Schema::table('test_cases', function (Blueprint $table): void {
            $table->dropForeign(['task_id']);
        });
        Schema::table('submissions', function (Blueprint $table): void {
            $table->dropForeign(['task_id']);
        });

        Schema::rename('tasks', 'exercises');

        Schema::table('exercises', function (Blueprint $table): void {
            $table->renameIndex('tasks_level_is_published_index', 'exercises_level_is_published_index');
            $table->foreignId('lesson_id')->nullable()->after('id');
            $table->unsignedInteger('position')->default(0)->after('lesson_id');
        });

        // Minden feladat sajat leckét kap a regi temakorenek megfelelo modulban,
        // a lista-nezet eddigi sorrendjeben (nehezseg, majd cim).
        $exercises = DB::table('exercises')->orderBy('topic_id')->orderBy('difficulty')->orderBy('title')->get();
        $positions = [];

        foreach ($exercises as $exercise) {
            $moduleId = is_numeric($exercise->topic_id) ? (int) $exercise->topic_id : throw new UnexpectedValueException('Feladat topic nelkul, a migracio nem folytathato.');
            $position = $positions[$moduleId] = ($positions[$moduleId] ?? -1) + 1;

            $lessonId = DB::table('lessons')->insertGetId([
                'module_id' => $moduleId,
                'slug' => $this->uniqueLessonSlug($moduleId, is_string($exercise->title) ? $exercise->title : ''),
                'title' => $exercise->title,
                'content' => null,
                'position' => $position,
                'is_published' => $exercise->is_published,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::table('exercises')->where('id', $exercise->id)->update(['lesson_id' => $lessonId, 'position' => 0]);
        }

        Schema::table('exercises', function (Blueprint $table): void {
            $table->dropColumn('topic_id');
        });

        Schema::table('exercises', function (Blueprint $table): void {
            $table->foreignId('lesson_id')->nullable(false)->change();
            $table->foreign('lesson_id')->references('id')->on('lessons')->cascadeOnDelete();
            $table->index(['lesson_id', 'position']);
        });
    }

    private function repointChildren(string $table, string $indexedWith): void
    {
        Schema::table($table, function (Blueprint $blueprint) use ($table, $indexedWith): void {
            $blueprint->dropIndex("{$table}_task_id_{$indexedWith}_index");
        });

        Schema::table($table, function (Blueprint $blueprint): void {
            $blueprint->renameColumn('task_id', 'exercise_id');
        });

        Schema::table($table, function (Blueprint $blueprint) use ($indexedWith): void {
            $blueprint->foreign('exercise_id')->references('id')->on('exercises')->cascadeOnDelete();
            $blueprint->index(['exercise_id', $indexedWith]);
        });
    }

    private function uniqueLessonSlug(int $moduleId, string $title): string
    {
        $base = Str::slug($title) ?: 'lecke';
        $slug = $base;

        for ($i = 2; DB::table('lessons')->where('module_id', $moduleId)->where('slug', $slug)->exists(); $i++) {
            $slug = "{$base}-{$i}";
        }

        return $slug;
    }

    private function restoreChildren(string $table, string $indexedWith): void
    {
        Schema::table($table, function (Blueprint $blueprint) use ($indexedWith): void {
            $blueprint->dropForeign(['exercise_id']);
            $blueprint->dropIndex(['exercise_id', $indexedWith]);
        });

        Schema::table($table, function (Blueprint $blueprint): void {
            $blueprint->renameColumn('exercise_id', 'task_id');
        });

        Schema::table($table, function (Blueprint $blueprint) use ($indexedWith): void {
            $blueprint->index(['task_id', $indexedWith]);
        });
    }

    private function exercisesToTasks(): void
    {
        Schema::table('exercises', function (Blueprint $table): void {
            $table->dropForeign(['lesson_id']);
            $table->dropIndex(['lesson_id', 'position']);
            $table->foreignId('topic_id')->nullable()->after('id');
        });

        foreach (DB::table('exercises')->join('lessons', 'lessons.id', '=', 'exercises.lesson_id')->select('exercises.id', 'lessons.module_id')->get() as $row) {
            DB::table('exercises')->where('id', $row->id)->update(['topic_id' => $row->module_id]);
        }

        Schema::table('exercises', function (Blueprint $table): void {
            $table->dropColumn(['lesson_id', 'position']);
        });

        Schema::table('exercises', function (Blueprint $table): void {
            $table->renameIndex('exercises_level_is_published_index', 'tasks_level_is_published_index');
            $table->foreignId('topic_id')->nullable(false)->change();
        });

        Schema::rename('exercises', 'tasks');

        foreach (['test_cases', 'submissions'] as $child) {
            Schema::table($child, function (Blueprint $table): void {
                $table->foreign('task_id')->references('id')->on('tasks')->cascadeOnDelete();
            });
        }
    }

    private function modulesToTopics(): void
    {
        Schema::table('modules', function (Blueprint $table): void {
            $table->dropForeign(['track_id']);
            $table->dropIndex(['track_id', 'position']);
        });

        Schema::table('modules', function (Blueprint $table): void {
            $table->dropColumn(['track_id', 'description', 'position']);
        });

        Schema::table('modules', function (Blueprint $table): void {
            $table->renameColumn('title', 'name');
        });

        Schema::rename('modules', 'topics');
    }
};
