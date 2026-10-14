<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\AttachmentRole;
use App\Services\Files\FileDisk;
use App\Services\Files\StoredFile;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Support\Carbon;

/**
 * Feladathoz vagy vizsgahoz csatolt fajl leiroja. A tartalom a privat
 * `exercise_files` tarolon van, es csak alairt URL-en at toltheto le
 * (App\Services\Files\AttachmentUrls).
 *
 * Sorokat az App\Actions\Admin\Catalog\ManageAttachment hoz letre es torol:
 * az ugyel a nevszabalyokra, a darabszam-korlatokra es arra, hogy a fajl a
 * sorral egyutt keletkezzen es tunjon el.
 *
 * @property int $id
 * @property string $attachable_type Morph alias: `exercise` vagy `exam`.
 * @property int $attachable_id
 * @property int|null $test_case_id Csak `input` szerepnel: a teszteset, amelyhez a fajl tartozik.
 * @property AttachmentRole $role
 * @property string $name A nyilvanos fajlnev (ezen a neven tolti le a diak, ezen a neven latja a program).
 * @property string $path Relativ utvonal a tarolon; veletlen, soha nem a nevbol kepzett.
 * @property int $size Meret byte-ban.
 * @property string $sha256
 * @property string $mime A tartalombol megallapitott tipus (finfo).
 * @property int $position Megjelenitesi sorrend a tulajdonoson es a szerepen belul.
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Exercise|Exam|null $attachable
 * @property-read TestCase|null $testCase
 */
final class Attachment extends Model
{
    protected $fillable = [
        'attachable_type', 'attachable_id', 'test_case_id', 'role', 'name',
        'path', 'size', 'sha256', 'mime', 'position',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'role' => AttachmentRole::class,
            'attachable_id' => 'integer',
            'test_case_id' => 'integer',
            'size' => 'integer',
            'position' => 'integer',
        ];
    }

    /**
     * A tulajdonos: feladat vagy vizsga.
     *
     * @return MorphTo<Model, $this>
     */
    public function attachable(): MorphTo
    {
        return $this->morphTo();
    }

    /** @return BelongsTo<TestCase, $this> */
    public function testCase(): BelongsTo
    {
        return $this->belongsTo(TestCase::class);
    }

    /**
     * @param  Builder<Attachment>  $query
     * @param  AttachmentRole|list<AttachmentRole>  $role
     */
    #[Scope]
    protected function ofRole(Builder $query, AttachmentRole|array $role): void
    {
        $query->whereIn('role', is_array($role) ? $role : [$role]);
    }

    /**
     * Nem tesztesethez kotott (kozos) fajlok: csak ezek jelenhetnek meg diaknak.
     *
     * @param  Builder<Attachment>  $query
     */
    #[Scope]
    protected function shared(Builder $query): void
    {
        $query->whereNull('test_case_id');
    }

    /** A kiterjesztes ponttal es kisbetuvel (pl. ".txt"); ures, ha a nevben nincs. */
    public function extension(): string
    {
        $extension = pathinfo($this->name, PATHINFO_EXTENSION);

        return $extension === '' ? '' : '.'.mb_strtolower($extension);
    }

    /** A tarolt fajl leiroja a PrivateFileStore es az olvasok szamara. */
    public function storedFile(): StoredFile
    {
        return new StoredFile(
            FileDisk::ExerciseFiles,
            $this->path,
            $this->name,
            $this->extension(),
            $this->size,
            $this->sha256,
            $this->mime,
        );
    }
}
