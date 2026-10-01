<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * Egy diak megoldas ELOTT megnyitotta a mintamegoldast (#154). Az utana
 * keszult beadasok `assisted` jelolest kapnak.
 *
 * @property int $user_id
 * @property int $exercise_id
 * @property int $failed_submissions
 * @property Carbon $revealed_at
 */
final class SolutionReveal extends Model
{
    public $timestamps = false;

    protected $fillable = ['user_id', 'exercise_id', 'failed_submissions', 'revealed_at'];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return ['failed_submissions' => 'integer', 'revealed_at' => 'datetime'];
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
