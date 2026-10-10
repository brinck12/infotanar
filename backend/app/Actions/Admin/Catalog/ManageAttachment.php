<?php

declare(strict_types=1);

namespace App\Actions\Admin\Catalog;

use App\Actions\Audit\RecordAuditEvent;
use App\Enums\AttachmentRole;
use App\Enums\AuditAction;
use App\Exceptions\Catalog\AttachmentLimitReached;
use App\Exceptions\Catalog\InvalidAttachment;
use App\Exceptions\FileTasks\MacroEnabledFile;
use App\Exceptions\FileTasks\UnsupportedUpload;
use App\Exceptions\FileTasks\UploadTooLarge;
use App\Models\Attachment;
use App\Models\Exam;
use App\Models\Exercise;
use App\Models\TestCase;
use App\Models\User;
use App\Services\Files\FileDisk;
use App\Services\Files\InspectedUpload;
use App\Services\Files\PrivateFileStore;
use App\Services\Files\StoredFile;
use App\Services\Files\UploadedFileInspector;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Throwable;

/**
 * Feladatok es vizsgak csatolt fajljainak kezelese: az egyetlen hely, ahol
 * `attachments` sor es a hozza tartozo fajl keletkezik vagy megszunik.
 *
 * Szabalyok (BACKEND.md 3.3, 4.1.5):
 *  - Feladathoz `source`, `input`, `sample_image`, `sample_solution` csatolhato,
 *    vizsgahoz csak `source_zip`. `input` csak szerkesztos feladat sajat
 *    tesztesetehez, `sample_solution` csak feltoltos feladathoz.
 *  - A `source` es az `input` neve szigoru mintat kovet (a program ezen a neven
 *    nyitja meg), es nem lehet a Judge0 sajat fajlneve.
 *  - Ugyanazzal a nevvel (kis-nagybetutol fuggetlenul) feltoltott fajl a regit
 *    csereli, a sor es az azonositoja megmarad. A `sample_image`, a
 *    `sample_solution` es a `source_zip` tulajdonosonkent egyetlen fajl: az uj
 *    feltoltes mindig a regit csereli.
 *  - A darabszam-korlatot es a nev-egyediseget a tulajdonos soranak zarolasa
 *    alatt ellenorizzuk (nem adatbazis-index: a NULL test_case_id kijatszana, es
 *    a ket motor mashogy kezeli a kis-nagybetut).
 *  - Fajl csak a tranzakcio vegleges sikere utan torlodik, igy egy
 *    visszagorgetes nem hagy fajl nelkuli sort.
 */
final readonly class ManageAttachment
{
    private const STRICT_NAME = '/^[A-Za-z0-9._-]{1,64}$/';

    /** Az `attachments.name` oszlop hossza. */
    private const MAX_NAME_LENGTH = 100;

    public function __construct(
        private UploadedFileInspector $inspector,
        private PrivateFileStore $files,
        private RecordAuditEvent $audit,
    ) {}

    /**
     * Ellenorzi es eltarolja a feltoltott fajlt, es letrehozza (vagy azonos
     * nevnel, illetve egypeldanyos szerepnel lecsereli) a csatolmanyt.
     *
     * @param  string|null  $name  a nyilvanos fajlnev; null = a feltoltott fajl eredeti neve. A kiterjesztese
     *                             meg kell egyezzen a feltoltott fajleval.
     * @param  TestCase|null  $testCase  kotelezo `input` szerepnel (a feladat sajat tesztesete), mas szerepnel tilos
     *
     * @throws InvalidAttachment a szerep, a teszteset vagy a nev nem felel meg a szabalyoknak
     * @throws AttachmentLimitReached tobb fajl mar nem csatolhato
     * @throws UnsupportedUpload|UploadTooLarge|MacroEnabledFile a fajl nem megy at az ellenorzesen
     */
    public function store(
        Exercise|Exam $owner,
        AttachmentRole $role,
        UploadedFile $file,
        User $actor,
        ?string $name = null,
        ?TestCase $testCase = null,
    ): Attachment {
        $this->assertRoleFits($owner, $role);
        $this->assertTestCaseFits($owner, $role, $testCase);

        $upload = $this->inspector->inspect($file, $this->extensionsFor($owner, $role), maxBytes: $this->maxBytesFor($owner, $role));
        $publicName = $this->publicName($role, $name, $upload);

        // Az uj fajl utvonala, amint a tarolora kerult: hiba eseten ebbol takaritunk.
        $storedPath = null;

        try {
            return DB::transaction(function () use ($owner, $role, $testCase, $upload, $publicName, $actor, &$storedPath): Attachment {
                $this->lock($owner);

                $siblings = $this->siblings($owner, $role, $testCase)->get();
                $existing = $role->isSingleton()
                    ? $siblings->first()
                    : $siblings->first(static fn (Attachment $sibling): bool => mb_strtolower($sibling->name) === mb_strtolower($publicName));

                $limit = $this->limitFor($owner, $role);

                if ($existing === null && $siblings->count() >= $limit) {
                    throw new AttachmentLimitReached($limit);
                }

                $stored = $this->files->put(FileDisk::ExerciseFiles, $owner->getMorphClass().'/'.$owner->id, $upload);
                $storedPath = $stored->path;
                $replaced = $existing?->storedFile();

                $attachment = $existing ?? new Attachment([
                    'attachable_type' => $owner->getMorphClass(),
                    'attachable_id' => $owner->id,
                    'test_case_id' => $testCase?->id,
                    'role' => $role,
                    'position' => $this->nextPosition($owner, $role),
                ]);

                $attachment->fill([
                    'name' => $publicName,
                    'path' => $stored->path,
                    'size' => $stored->size,
                    'sha256' => $stored->sha256,
                    'mime' => $stored->mime,
                ])->save();

                $this->audit->handle(AuditAction::AttachmentUploaded, $actor, $attachment, [
                    ...$this->describe($attachment),
                    'replaced' => $replaced !== null,
                ]);

                if ($replaced !== null) {
                    DB::afterCommit(fn () => $this->files->delete($replaced));
                }

                return $attachment;
            });
        } catch (Throwable $exception) {
            // A sor nem jott letre (vagy visszagorgott): az uj fajl ne maradjon arvan.
            if (is_string($storedPath)) {
                $this->files->deletePath(FileDisk::ExerciseFiles, $storedPath);
            }

            throw $exception;
        }
    }

    /** Torli a csatolmanyt es a fajljat. */
    public function delete(Attachment $attachment, User $actor): void
    {
        DB::transaction(function () use ($attachment, $actor): void {
            $file = $attachment->storedFile();

            $this->audit->handle(AuditAction::AttachmentDeleted, $actor, $attachment, $this->describe($attachment));
            $attachment->delete();

            DB::afterCommit(fn () => $this->files->delete($file));
        });
    }

    /**
     * A tulajdonos (feladat vagy vizsga) osszes csatolmanya a fajlokkal
     * egyutt; a tulajdonost torlo Action hivja, a sajat tranzakciojaban.
     * Kulon naplobejegyzes nem keszul: a tulajdonos torlese mar naplozott.
     */
    public function deleteAllFor(Model $owner): void
    {
        DB::transaction(function () use ($owner): void {
            $attachments = Attachment::query()
                ->where('attachable_type', $owner->getMorphClass())
                ->where('attachable_id', $owner->getKey())
                ->get();

            if ($attachments->isEmpty()) {
                return;
            }

            $files = $attachments->map(static fn (Attachment $attachment): StoredFile => $attachment->storedFile())->all();

            Attachment::query()->whereKey($attachments->modelKeys())->delete();

            DB::afterCommit(function () use ($files): void {
                foreach ($files as $file) {
                    $this->files->delete($file);
                }
            });
        });
    }

    /** @throws InvalidAttachment */
    private function assertRoleFits(Exercise|Exam $owner, AttachmentRole $role): void
    {
        $fits = match (true) {
            $owner instanceof Exam => $role === AttachmentRole::SourceZip,
            $role === AttachmentRole::Input => $owner->kind->isEditorBased(),
            $role === AttachmentRole::SampleSolution => $owner->kind->isUpload(),
            default => in_array($role, AttachmentRole::forExercises(), true),
        };

        if (! $fits) {
            throw InvalidAttachment::roleNotAllowed();
        }
    }

    /** @throws InvalidAttachment */
    private function assertTestCaseFits(Exercise|Exam $owner, AttachmentRole $role, ?TestCase $testCase): void
    {
        if ($role->requiresTestCase()) {
            if ($testCase === null) {
                throw InvalidAttachment::testCaseRequired();
            }

            if (! $owner instanceof Exercise || $testCase->exercise_id !== $owner->id) {
                throw InvalidAttachment::testCaseNotAllowed();
            }

            return;
        }

        if ($testCase !== null) {
            throw InvalidAttachment::testCaseNotAllowed();
        }
    }

    /**
     * A szerepben feltoltheto kiterjesztesek.
     *
     * @return list<string>
     */
    private function extensionsFor(Exercise|Exam $owner, AttachmentRole $role): array
    {
        return match ($role) {
            AttachmentRole::SourceZip => ['.zip'],
            AttachmentRole::SampleImage => $this->stringList('filetasks.attachments.sample_image_extensions'),
            AttachmentRole::SampleSolution => $owner instanceof Exercise ? $owner->kind->uploadExtensions() : [],
            // A Judge0-hoz is elmeno fajlok: csak szoveges adatfajl.
            AttachmentRole::Input => $this->knownExtensions('text'),
            AttachmentRole::Source => $this->knownExtensions($this->isJudge0Bound($owner, $role) ? 'text' : null),
        };
    }

    /**
     * A `filetasks.extensions` kiterjesztesei; kategoria megadasakor csak az abba tartozok.
     *
     * @return list<string>
     */
    private function knownExtensions(?string $category = null): array
    {
        $extensions = [];

        foreach (Config::array('filetasks.extensions') as $extension => $extensionCategory) {
            if (is_string($extension) && ($category === null || $extensionCategory === $category)) {
                $extensions[] = $extension;
            }
        }

        return $extensions;
    }

    /** A szerepre ervenyes tovabbi meretkorlat byte-ban; null = csak a kategoriae. */
    private function maxBytesFor(Exercise|Exam $owner, AttachmentRole $role): ?int
    {
        return match ($role) {
            AttachmentRole::SourceZip => null,
            AttachmentRole::SampleImage => Config::integer('filetasks.attachments.sample_image_max_bytes'),
            AttachmentRole::SampleSolution => Config::integer('filetasks.attachments.sample_solution_max_bytes'),
            AttachmentRole::Input => Config::integer('filetasks.attachments.judge0_max_bytes'),
            AttachmentRole::Source => $this->isJudge0Bound($owner, $role)
                ? Config::integer('filetasks.attachments.judge0_max_bytes')
                : Config::integer('filetasks.attachments.source_max_bytes'),
        };
    }

    /** Hany fajl lehet a szerepben (bemeneti fajlnal tesztesetenkent). */
    private function limitFor(Exercise|Exam $owner, AttachmentRole $role): int
    {
        return match (true) {
            $role->isSingleton() => 1,
            $this->isJudge0Bound($owner, $role) => Config::integer('filetasks.attachments.judge0_max_files'),
            default => Config::integer('filetasks.attachments.source_max_files'),
        };
    }

    /** A fajl a futtatasi konyvtarba kerul-e a Judge0-ban: bemeneti fajl, es szerkesztos feladat forrasfajlja. */
    private function isJudge0Bound(Exercise|Exam $owner, AttachmentRole $role): bool
    {
        return $role === AttachmentRole::Input
            || ($role === AttachmentRole::Source && $owner instanceof Exercise && $owner->kind->isEditorBased());
    }

    /** @throws InvalidAttachment */
    private function publicName(AttachmentRole $role, ?string $name, InspectedUpload $upload): string
    {
        $requested = $name === null || trim($name) === '' ? $upload->name : trim($name);

        if ($role->hasStrictName()) {
            if (preg_match(self::STRICT_NAME, $requested) !== 1 || in_array($requested, ['.', '..'], true)) {
                throw InvalidAttachment::name();
            }

            if (in_array(mb_strtolower($requested), $this->stringList('filetasks.attachments.judge0_reserved_names'), true)) {
                throw InvalidAttachment::reservedName($requested);
            }
        }

        $publicName = UploadedFileInspector::safeName($requested);

        if (mb_strlen($publicName) > self::MAX_NAME_LENGTH) {
            throw InvalidAttachment::nameTooLong();
        }

        // A nev kiterjesztese nem mondhat mast, mint amit a tartalomrol ellenoriztunk.
        if (UploadedFileInspector::extensionOf($publicName) !== $upload->extension) {
            throw InvalidAttachment::extensionMismatch($upload->extension);
        }

        return $publicName;
    }

    /**
     * Azok a csatolmanyok, amelyek kozott a nevnek egyedinek kell lennie, es
     * amelyekre a darabszam-korlat vonatkozik.
     *
     * @return Builder<Attachment>
     */
    private function siblings(Exercise|Exam $owner, AttachmentRole $role, ?TestCase $testCase): Builder
    {
        return Attachment::query()
            ->where('attachable_type', $owner->getMorphClass())
            ->where('attachable_id', $owner->id)
            ->where('role', $role)
            ->when(
                $testCase !== null,
                static fn (Builder $query) => $query->where('test_case_id', $testCase?->id),
                static fn (Builder $query) => $query->whereNull('test_case_id'),
            )
            ->orderBy('id');
    }

    private function nextPosition(Exercise|Exam $owner, AttachmentRole $role): int
    {
        $last = Attachment::query()
            ->where('attachable_type', $owner->getMorphClass())
            ->where('attachable_id', $owner->id)
            ->where('role', $role)
            ->max('position');

        return is_numeric($last) ? (int) $last + 1 : 0;
    }

    /** A tulajdonos soranak zarolasa: ket egyideju feltoltes ne lephesse at a korlatot. */
    private function lock(Exercise|Exam $owner): void
    {
        $owner->newQuery()->whereKey($owner->id)->lockForUpdate()->firstOrFail();
    }

    /** @return array{owner: array{type: string, id: int}, role: string, name: string} */
    private function describe(Attachment $attachment): array
    {
        return [
            'owner' => ['type' => $attachment->attachable_type, 'id' => $attachment->attachable_id],
            'role' => $attachment->role->value,
            'name' => $attachment->name,
        ];
    }

    /** @return list<string> */
    private function stringList(string $key): array
    {
        return array_values(array_filter(Config::array($key), is_string(...)));
    }
}
