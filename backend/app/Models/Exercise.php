<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Megoldando programozasi feladat tesztesetekkel. A v1 API-ban "task" neven szerepel.
 *
 * Az oszlopok explicit dokumentaltak: a tabla atnevezessel (tasks -> exercises)
 * jott letre, amit a statikus elemzo a migraciokbol nem tud kovetni.
 *
 * @property int $id
 * @property int $lesson_id
 * @property int $position
 * @property string $title
 * @property string $description
 * @property string $level
 * @property int $difficulty
 * @property list<string>|null $allowed_languages
 * @property array<string, string>|null $starter_code
 * @property bool $is_published
 */
final class Exercise extends Model
{
    protected $fillable = [
        'lesson_id', 'position', 'title', 'description', 'level',
        'difficulty', 'allowed_languages', 'starter_code', 'is_published',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'allowed_languages' => 'array',
            'starter_code' => 'array',
            'is_published' => 'boolean',
            'difficulty' => 'integer',
            'position' => 'integer',
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
     * Diak szamara lathato: maga a feladat es a leckeje is publikalt.
     *
     * @param  Builder<Exercise>  $query
     */
    #[Scope]
    protected function published(Builder $query): void
    {
        $query->where('is_published', true)
            ->whereHas('lesson', static fn (Builder $lesson) => $lesson->where('is_published', true));
    }
}
