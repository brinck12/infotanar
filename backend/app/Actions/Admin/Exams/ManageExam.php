<?php

declare(strict_types=1);

namespace App\Actions\Admin\Exams;

use App\Actions\Audit\RecordAuditEvent;
use App\Enums\AuditAction;
use App\Exceptions\Exams\ExamNotPublishable;
use App\Http\Requests\Admin\Exams\ExamRequest;
use App\Models\Exam;
use App\Models\ExamPart;
use App\Models\User;
use App\Services\Exams\PartReadiness;
use Illuminate\Support\Facades\DB;

/**
 * Vizsga létrehozása és módosítása. Közzétenni csak teljes vizsgát lehet
 * (BACKEND.md 4.5.4): van része, minden résznek kész az értékelőlapja vagy a
 * tesztjei, a szerkesztős részek feladata publikált, és a részek pontjainak
 * összege a vizsga összpontja. A visszavonás mindig megengedett.
 */
final readonly class ManageExam
{
    public function __construct(
        private RecordAuditEvent $audit,
        private PartReadiness $readiness,
    ) {}

    /**
     * @param  array<string, mixed>  $attributes
     *
     * @throws ExamNotPublishable ha közzétett vizsgát kérnek (részek még nincsenek)
     */
    public function create(array $attributes, User $actor): Exam
    {
        if (($attributes['is_published'] ?? false) === true) {
            throw ExamNotPublishable::noParts();
        }

        return DB::transaction(function () use ($attributes, $actor): Exam {
            $exam = new Exam([...$attributes, 'session' => $attributes['session'] ?? ExamRequest::defaultSession()]);
            $exam->save();

            $this->audit->handle(AuditAction::CatalogCreated, $actor, $exam);

            return $exam;
        });
    }

    /**
     * @param  array<string, mixed>  $attributes
     *
     * @throws ExamNotPublishable ha a közzététel feltételei nem teljesülnek
     */
    public function update(Exam $exam, array $attributes, User $actor): Exam
    {
        return DB::transaction(function () use ($exam, $attributes, $actor): Exam {
            $locked = Exam::query()->lockForUpdate()->findOrFail($exam->id);
            $wasPublished = $locked->is_published;
            $locked->fill($attributes);

            if ($locked->is_published) {
                $this->assertPublishable($locked);
            }

            $changes = array_values(array_diff(array_keys($locked->getDirty()), ['is_published']));
            $publishChanged = $locked->isDirty('is_published');
            $locked->save();

            if ($publishChanged) {
                $this->audit->handle($locked->is_published ? AuditAction::ExamPublished : AuditAction::ExamUnpublished, $actor, $locked);
            }

            if ($changes !== []) {
                $this->audit->handle(AuditAction::CatalogUpdated, $actor, $locked, ['fields' => $changes, 'was_published' => $wasPublished]);
            }

            return $locked;
        });
    }

    /**
     * A közzététel feltételei a vizsga (még el nem mentett) adataival.
     *
     * @throws ExamNotPublishable
     */
    private function assertPublishable(Exam $exam): void
    {
        PartReadiness::load($exam);
        $parts = $exam->parts;

        if ($parts->isEmpty()) {
            throw ExamNotPublishable::noParts();
        }

        foreach ($parts as $part) {
            if ($this->readiness->of($part)['status'] === PartReadiness::INCOMPLETE) {
                throw ExamNotPublishable::rubricIncomplete($part->order());
            }
        }

        foreach ($parts as $part) {
            $exercise = $part->exercise;

            if ($exercise !== null && $exercise->kind->isEditorBased() && ! $exercise->is_published) {
                throw ExamNotPublishable::exerciseUnpublished($part->order());
            }
        }

        $sum = $parts->reduce(static fn (int $carry, ExamPart $part): int => $carry + $part->points, 0);

        if ($sum !== $exam->points) {
            throw ExamNotPublishable::pointsMismatch($sum, $exam->points);
        }
    }
}
