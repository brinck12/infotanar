<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $exercise_id
 * @property-read Exercise $exercise A exercise_id NOT NULL + cascade: a feladat mindig letezik.
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

    /** @return BelongsTo<Exercise, $this> */
    public function exercise(): BelongsTo
    {
        return $this->belongsTo(Exercise::class);
    }
}
