<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property list<string>|null $allowed_languages
 * @property array<string, string>|null $starter_code
 */
final class Task extends Model
{
    protected $fillable = [
        'topic_id', 'title', 'description', 'level',
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
        ];
    }

    /** @return BelongsTo<Topic, $this> */
    public function topic(): BelongsTo
    {
        return $this->belongsTo(Topic::class);
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

    /** @param Builder<Task> $query */
    #[Scope]
    protected function published(Builder $query): void
    {
        $query->where('is_published', true);
    }
}
