<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $exercise_id
 */
final class TestCase extends Model
{
    protected $fillable = ['exercise_id', 'stdin', 'expected_stdout', 'is_hidden', 'order'];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'is_hidden' => 'boolean',
            'order' => 'integer',
        ];
    }

    /**
     * Csak ennel a tesztesetnel jelen levo fajlok; a kozos, azonos nevu fajl helyere lepnek.
     *
     * @return HasMany<ExerciseFile, $this>
     */
    public function files(): HasMany
    {
        return $this->hasMany(ExerciseFile::class);
    }

    /** @return BelongsTo<Exercise, $this> */
    public function exercise(): BelongsTo
    {
        return $this->belongsTo(Exercise::class);
    }
}
