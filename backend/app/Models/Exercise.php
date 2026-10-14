<?php

declare(strict_types=1);

namespace App\Models;

use App\Casts\AsConstraintSet;
use App\Enums\ExerciseKind;
use App\Services\Constraints\ConstraintSet;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

/**
 * Megoldando feladat. A v1 API-ban "task" neven szerepel.
 *
 * A fajtaja (`kind`) donti el, hogyan oldja meg a diak es mi ertekeli:
 * szerkesztos feladatnal a tesztesetek, feltoltosnel az ertekelolap
 * (rubricItems), bongeszosnel a `spec`-ben leirt ellenorzesek a kliensen.
 *
 * Az oszlopok explicit dokumentaltak: a tabla atnevezessel (tasks -> exercises)
 * jott letre, amit a statikus elemzo a migraciokbol nem tud kovetni.
 *
 * @property int $id
 * @property int $lesson_id
 * @property int $position
 * @property ExerciseKind $kind
 * @property string $title
 * @property string $description
 * @property string $level
 * @property int $difficulty
 * @property list<string>|null $allowed_languages
 * @property array<string, string>|null $starter_code
 * @property bool $sql_order_sensitive SQL-feladatnal szamit-e a sorok sorrendje.
 * @property ConstraintSet $constraints Statikus kodszabalyok (#42); ures, ha nincs.
 * @property array<string, mixed>|null $spec A fajtahoz tartozo adatok; az alakjat fajtankent a BACKEND.md 4.1.3 irja le.
 * @property array<string, mixed>|null $comparison A kimenet osszehasonlitasanak modja; NULL = soronkenti egyezes.
 * @property int|null $time_limit_ms Sajat processzorido-korlat (#151); null = globalis alapertek.
 * @property int|null $memory_limit_kb Sajat memoriakorlat (#151); null = globalis alapertek.
 * @property bool $is_published
 * @property-read int $file_submissions_count Csak `withCount('fileSubmissions')` utan elerheto (strict modban egyebkent hibat dob).
 * @property-read Lesson $lesson A lesson_id NOT NULL + cascade: a lecke mindig letezik.
 */
final class Exercise extends Model
{
    protected $fillable = [
        'lesson_id', 'position', 'kind', 'title', 'description', 'level',
        'difficulty', 'allowed_languages', 'starter_code', 'constraints', 'spec', 'comparison',
        'sql_order_sensitive', 'time_limit_ms', 'memory_limit_kb', 'is_published',
    ];

    /**
     * Az oszlop alaperteke is `code`; itt azert all, hogy a frissen letrehozott
     * (meg vissza nem olvasott) modellen is legyen fajta.
     *
     * @var array<string, mixed>
     */
    protected $attributes = [
        'kind' => 'code',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'kind' => ExerciseKind::class,
            'allowed_languages' => 'array',
            'spec' => 'array',
            'comparison' => 'array',
            'starter_code' => 'array',
            'is_published' => 'boolean',
            'sql_order_sensitive' => 'boolean',
            'constraints' => AsConstraintSet::class,
            'difficulty' => 'integer',
            'position' => 'integer',
            'time_limit_ms' => 'integer',
            'memory_limit_kb' => 'integer',
        ];
    }

    /** @return BelongsTo<Lesson, $this> */
    public function lesson(): BelongsTo
    {
        return $this->belongsTo(Lesson::class);
    }

    /** @return HasMany<TestCase, $this> */
    public function testCases(): HasMany
    {
        return $this->hasMany(TestCase::class)->orderBy('order');
    }

    /**
     * Csak a feladatmegoldo oldalon megmutathato (nem rejtett) tesztesetek.
     *
     * @return HasMany<TestCase, $this>
     */
    public function visibleTestCases(): HasMany
    {
        return $this->testCases()->where('is_hidden', false);
    }

    /** @return HasMany<TestCase, $this> */
    public function hiddenTestCases(): HasMany
    {
        return $this->hasMany(TestCase::class)->where('is_hidden', true);
    }

    /** @return HasMany<Submission, $this> */
    public function submissions(): HasMany
    {
        return $this->hasMany(Submission::class);
    }

    /**
     * A feladat fajljai sorrendben: forrasfajlok, tesztesetenkenti bemenetek,
     * mintakep, mintamegoldas. Diaknak csak a `source` es a `sample_image`
     * szerepu, tesztesethez nem kotott fajl mehet ki.
     *
     * @return MorphMany<Attachment, $this>
     */
    public function attachments(): MorphMany
    {
        return $this->morphMany(Attachment::class, 'attachable')->orderBy('position')->orderBy('id');
    }

    /**
     * Az ertekelolap pontjai sorrendben (fajlfeladatnal).
     *
     * @return HasMany<RubricItem, $this>
     */
    public function rubricItems(): HasMany
    {
        return $this->hasMany(RubricItem::class)->orderBy('position');
    }

    /**
     * A feladathoz feltoltott fajlok: gyakorlo es vizsgaban keletkezett sorok egyutt.
     *
     * @return HasMany<FileSubmission, $this>
     */
    public function fileSubmissions(): HasMany
    {
        return $this->hasMany(FileSubmission::class);
    }

    /**
     * A vizsgareszek, amelyek erre a feladatra mutatnak.
     *
     * @return HasMany<ExamPart, $this>
     */
    public function examParts(): HasMany
    {
        return $this->hasMany(ExamPart::class);
    }

    /**
     * Diak szamara lathato: maga a feladat es a leckeje is publikalt.
     *
     * @param  Builder<Exercise>  $query
     */
    #[Scope]
    protected function published(Builder $query): void
    {
        $query->where('is_published', true)
            ->whereHas('lesson', static fn (Builder $lesson) => $lesson->published());
    }
}
