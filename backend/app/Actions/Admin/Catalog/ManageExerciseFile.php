<?php

declare(strict_types=1);

namespace App\Actions\Admin\Catalog;

use App\Actions\Audit\RecordAuditEvent;
use App\Enums\AuditAction;
use App\Exceptions\Catalog\ExerciseFileLimitReached;
use App\Models\Exercise;
use App\Models\ExerciseFile;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;

/**
 * Adatfajlok kezelese egy feladaton belul (#152).
 *
 * Egy fajl "hatokore" a kozos fajlok halmaza, vagy egy teszteset felulirasai.
 * Egy hatokorben a nev egyedi: azonos nevu feltoltes lecsereli a regit, igy a
 * cserehez nem kell elobb torolni. A tartalom nem kerul az audit naploba.
 */
final readonly class ManageExerciseFile
{
    public function __construct(private RecordAuditEvent $audit) {}

    /** @throws ExerciseFileLimitReached */
    public function store(Exercise $exercise, UploadedFile $upload, string $name, ?int $testCaseId, User $actor): ExerciseFile
    {
        return DB::transaction(function () use ($exercise, $upload, $name, $testCaseId, $actor): ExerciseFile {
            $existing = $this->scope($exercise, $testCaseId)->where('name', $name)->first();

            if ($existing === null) {
                $this->assertRoomForAnother($exercise, $testCaseId);
            }

            $bytes = (string) $upload->get();
            $file = $existing ?? new ExerciseFile(['exercise_id' => $exercise->id, 'test_case_id' => $testCaseId, 'name' => $name]);
            $file->fill([
                'content' => base64_encode($bytes),
                'size' => strlen($bytes),
                'sha256' => hash('sha256', $bytes),
            ]);
            $file->save();

            $this->audit->handle(
                $existing === null ? AuditAction::CatalogCreated : AuditAction::CatalogUpdated,
                $actor,
                $file,
                ['name' => $name, 'size' => $file->size, 'test_case_id' => $testCaseId],
            );

            return $file;
        });
    }

    public function delete(ExerciseFile $file, User $actor): void
    {
        DB::transaction(function () use ($file, $actor): void {
            $this->audit->handle(
                AuditAction::CatalogDeleted,
                $actor,
                $file,
                ['name' => $file->name, 'size' => $file->size, 'test_case_id' => $file->test_case_id],
            );
            $file->delete();
        });
    }

    /** @throws ExerciseFileLimitReached */
    private function assertRoomForAnother(Exercise $exercise, ?int $testCaseId): void
    {
        $limit = Config::integer('judge0.files.max_per_scope');

        if ($this->scope($exercise, $testCaseId)->count() >= $limit) {
            throw new ExerciseFileLimitReached($limit);
        }
    }

    /** @return Builder<ExerciseFile> A kozos fajlok (null), vagy egy teszteset felulirasai. */
    private function scope(Exercise $exercise, ?int $testCaseId): Builder
    {
        return ExerciseFile::query()
            ->where('exercise_id', $exercise->id)
            ->where('test_case_id', $testCaseId);
    }
}
