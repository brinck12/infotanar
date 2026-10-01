<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Mintamegoldas egy feladathoz es egy nyelvhez (#154), magyarazattal.
 *
 * @property int $id
 * @property int $exercise_id
 * @property string $language
 * @property string $source_code
 * @property string|null $explanation Markdown.
 */
final class ExerciseSolution extends Model
{
    protected $fillable = ['exercise_id', 'language', 'source_code', 'explanation'];

    /** @return BelongsTo<Exercise, $this> */
    public function exercise(): BelongsTo
    {
        return $this->belongsTo(Exercise::class);
    }
}
