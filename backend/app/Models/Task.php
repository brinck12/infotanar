<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Task extends Model
{
    use HasFactory;

    protected $fillable = [
        'topic_id', 'title', 'description', 'level',
        'difficulty', 'allowed_languages', 'starter_code', 'is_published',
    ];

    protected function casts(): array
    {
        return [
            'allowed_languages' => 'array',
            'starter_code' => 'array',
            'is_published' => 'boolean',
            'difficulty' => 'integer',
        ];
    }

    public function topic(): BelongsTo
    {
        return $this->belongsTo(Topic::class);
    }

    public function testCases(): HasMany
    {
        return $this->hasMany(TestCase::class)->orderBy('order');
    }

    /** Csak a feladatmegoldo oldalon megmutathato (nem rejtett) tesztesetek. */
    public function visibleTestCases(): HasMany
    {
        return $this->testCases()->where('is_hidden', false);
    }

    public function submissions(): HasMany
    {
        return $this->hasMany(Submission::class);
    }

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('is_published', true);
    }
}
