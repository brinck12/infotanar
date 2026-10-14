<?php

declare(strict_types=1);

namespace App\Actions\Admin\Exams;

use App\Actions\Audit\RecordAuditEvent;
use App\Enums\AuditAction;
use App\Exceptions\Catalog\CatalogItemInUse;
use App\Exceptions\Catalog\InvalidOrder;
use App\Exceptions\Exams\PublishedExamLocked;
use App\Models\Exam;
use App\Models\ExamAttempt;
use App\Models\ExamPart;
use App\Models\Exercise;
use App\Models\User;
use App\Services\Catalog\SiblingOrder;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Egy vizsga részeinek szerkesztése: hozzáadás, törlés, sorrend. Minden
 * változás naplózott; a sorrend (position 0..n-1) a SiblingOrder-rel marad
 * hézagmentes.
 */
final readonly class ManageExamPart
{
    public function __construct(
        private SiblingOrder $order,
        private RecordAuditEvent $audit,
    ) {}

    /**
     * Új rész a vizsga végére.
     *
     * @param  array<string, mixed>  $attributes  `key`, `name`, `exercise_id`, `points`, `minutes`
     *
     * @throws PublishedExamLocked ha a vizsga közzé van téve
     * @throws ValidationException ha a feladat fajtája nem illik vizsgarészhez
     */
    public function add(Exam $exam, array $attributes, User $actor): ExamPart
    {
        $this->assertExerciseFits($attributes['exercise_id'] ?? null);

        return DB::transaction(function () use ($exam, $attributes, $actor): ExamPart {
            $locked = Exam::query()->lockForUpdate()->findOrFail($exam->id);

            if ($locked->is_published) {
                throw new PublishedExamLocked;
            }

            $part = new ExamPart([...$attributes, 'exam_id' => $locked->id]);
            $part->position = $this->order->next($this->siblings($locked));
            $part->save();

            $this->audit->handle(AuditAction::CatalogCreated, $actor, $part);

            return $part;
        });
    }

    /**
     * Törlés. Ha a vizsgán már van próbálkozás, a rész eredményei a diákok
     * adatai: nem törölhető.
     *
     * @throws CatalogItemInUse
     */
    public function remove(ExamPart $part, User $actor): void
    {
        DB::transaction(function () use ($part, $actor): void {
            $exam = Exam::query()->lockForUpdate()->findOrFail($part->exam_id);

            if (ExamAttempt::query()->where('exam_id', $exam->id)->exists()) {
                throw CatalogItemInUse::hasStudentData();
            }

            if ($exam->is_published) {
                throw PublishedExamLocked::forRemoval();
            }

            $this->audit->handle(AuditAction::CatalogDeleted, $actor, $part, ['attributes' => $part->attributesToArray()]);
            $part->delete();
            $this->order->compact($this->siblings($exam));
        });
    }

    /**
     * @param  list<int>  $orderedIds  a vizsga összes része, egyszer
     *
     * @throws InvalidOrder
     */
    public function reorder(Exam $exam, array $orderedIds, User $actor): void
    {
        DB::transaction(function () use ($exam, $orderedIds, $actor): void {
            $this->order->reorder($this->siblings($exam), $orderedIds);
            $this->audit->handle(AuditAction::CatalogReordered, $actor, $exam, ['order' => $orderedIds]);
        });
    }

    /** @return Builder<ExamPart> */
    private function siblings(Exam $exam): Builder
    {
        return ExamPart::query()->where('exam_id', $exam->id);
    }

    /** @throws ValidationException */
    private function assertExerciseFits(mixed $exerciseId): void
    {
        if (! is_int($exerciseId)) {
            return;
        }

        $exercise = Exercise::query()->find($exerciseId);

        if ($exercise === null || (! $exercise->kind->isEditorBased() && ! $exercise->kind->isUpload())) {
            throw ValidationException::withMessages(['exercise_id' => [__('exams.part_exercise_kind')]]);
        }
    }
}
