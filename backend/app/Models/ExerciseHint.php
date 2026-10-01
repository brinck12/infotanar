<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Egy tipp a feladathoz (#154), Markdown szoveg. A diak a `position` szerinti
 * sorrendben, egyenkent kapja meg oket.
 *
 * @property int $id
 * @property int $exercise_id
 * @property int $position
 * @property string $body
 */
final class ExerciseHint extends Model
{
    protected $fillable = ['exercise_id', 'position', 'body'];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return ['position' => 'integer'];
    }

    /** @return BelongsTo<Exercise, $this> */
    public function exercise(): BelongsTo
    {
        return $this->belongsTo(Exercise::class);
    }
}
