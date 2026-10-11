<?php

declare(strict_types=1);

namespace App\Actions\Admin\Catalog;

use App\Actions\Audit\RecordAuditEvent;
use App\Enums\AuditAction;
use App\Exceptions\Catalog\PublishedExerciseNeedsVisibleTestCase;
use App\Models\Attachment;
use App\Models\Exercise;
use App\Models\TestCase;
use App\Models\User;
use App\Services\Catalog\SiblingOrder;
use App\Services\Files\PrivateFileStore;
use App\Services\Files\StoredFile;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

/**
 * Tesztesetek kezelese egy feladaton belul (#46).
 *
 * - A sorrend (`order`) mindig 0..n-1 (SiblingOrder).
 * - Publikalt feladatnak mindig marad legalabb egy nyilvanos tesztesete: a
 *   valtozast a tranzakcion belul ellenorizzuk, es sertes eseten visszagorgetjuk.
 * - Torles nem erinti a korabbi beadasokat: azok eredmenye pillanatkep
 *   (submissions.results), idegen kulcs nelkul.
 * - Torleskor a teszteset sajat bemeneti fajljai (`input` csatolmanyok) is
 *   torlodnek, a tarolorol is.
 */
final readonly class ManageTestCase
{
    private const ORDER = 'order';

    public function __construct(
        private SiblingOrder $order,
        private RecordAuditEvent $audit,
        private PrivateFileStore $files,
    ) {}

    /** @param array<string, mixed> $attributes */
    public function create(Exercise $exercise, array $attributes, User $actor): TestCase
    {
        return DB::transaction(function () use ($exercise, $attributes, $actor): TestCase {
            $testCase = new TestCase($attributes);
            $testCase->exercise_id = $exercise->id;
            $testCase->setAttribute(self::ORDER, $this->order->next($this->siblings($exercise)));
            $testCase->save();

            $this->audit->handle(AuditAction::CatalogCreated, $actor, $testCase);

            return $testCase;
        });
    }

    /**
     * @param  array<string, mixed>  $attributes
     *
     * @throws PublishedExerciseNeedsVisibleTestCase
     */
    public function update(TestCase $testCase, array $attributes, User $actor): TestCase
    {
        return DB::transaction(function () use ($testCase, $attributes, $actor): TestCase {
            $testCase->fill($attributes);
            $changes = array_keys($testCase->getDirty());
            $testCase->save();

            $this->assertPublishedExerciseStaysRunnable($testCase->exercise_id);
            $this->audit->handle(AuditAction::CatalogUpdated, $actor, $testCase, ['fields' => $changes]);

            return $testCase;
        });
    }

    /** @throws PublishedExerciseNeedsVisibleTestCase */
    public function delete(TestCase $testCase, User $actor): void
    {
        DB::transaction(function () use ($testCase, $actor): void {
            $exerciseId = $testCase->exercise_id;
            $inputFiles = $this->deleteInputAttachments($testCase);

            $this->audit->handle(AuditAction::CatalogDeleted, $actor, $testCase, ['attributes' => $testCase->attributesToArray()]);
            $testCase->delete();

            $this->assertPublishedExerciseStaysRunnable($exerciseId);
            $this->order->compact(TestCase::query()->where('exercise_id', $exerciseId), self::ORDER);

            // A fajlok csak a vegleges siker utan tunnek el: visszagorgetesnel a sorok
            // visszajonnek, es a fajljuknak is meg kell lennie.
            DB::afterCommit(function () use ($inputFiles): void {
                foreach ($inputFiles as $file) {
                    $this->files->delete($file);
                }
            });
        });
    }

    /**
     * Torli a teszteset sajat bemeneti fajljainak (`input` csatolmanyok)
     * sorait, es visszaadja a fajlokat, amelyeket a hivo a tranzakcio utan
     * torol a tarolorol. Az idegen kulcs (cascade) a sorokat magatol is
     * torolne, a fajlokrol viszont nem tud: azok arvan maradnanak.
     *
     * @return list<StoredFile>
     */
    private function deleteInputAttachments(TestCase $testCase): array
    {
        $attachments = Attachment::query()->where('test_case_id', $testCase->id)->get();

        if ($attachments->isEmpty()) {
            return [];
        }

        Attachment::query()->whereKey($attachments->modelKeys())->delete();

        return array_values($attachments->map(static fn (Attachment $attachment): StoredFile => $attachment->storedFile())->all());
    }

    /** @param list<int> $orderedIds */
    public function reorder(Exercise $exercise, array $orderedIds, User $actor): void
    {
        DB::transaction(function () use ($exercise, $orderedIds, $actor): void {
            $this->order->reorder($this->siblings($exercise), $orderedIds, self::ORDER);
            $this->audit->handle(AuditAction::CatalogReordered, $actor, $exercise, ['test_case_order' => $orderedIds]);
        });
    }

    /** @throws PublishedExerciseNeedsVisibleTestCase */
    private function assertPublishedExerciseStaysRunnable(int $exerciseId): void
    {
        $published = Exercise::query()->whereKey($exerciseId)->where('is_published', true)->exists();

        if ($published && ! TestCase::query()->where('exercise_id', $exerciseId)->where('is_hidden', false)->exists()) {
            throw new PublishedExerciseNeedsVisibleTestCase;
        }
    }

    /** @return Builder<TestCase> */
    private function siblings(Exercise $exercise): Builder
    {
        return TestCase::query()->where('exercise_id', $exercise->id);
    }
}
