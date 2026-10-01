<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * Egy diak megnyitotta a feladat n-edik tippjet (#154).
 *
 * @property int $user_id
 * @property int $exercise_id
 * @property int $position Hanyadik tipp, 1-tol.
 * @property Carbon $revealed_at
 */
final class HintReveal extends Model
{
    public $timestamps = false;

    protected $fillable = ['user_id', 'exercise_id', 'position', 'revealed_at'];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return ['position' => 'integer', 'revealed_at' => 'datetime'];
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return BelongsTo<Exercise, $this> */
    public function exercise(): BelongsTo
    {
        return $this->belongsTo(Exercise::class);
    }
}
