<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $exercise_id
 */
final class Submission extends Model
{
    protected $fillable = ['user_id', 'exercise_id', 'language', 'source_code', 'status', 'results'];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return ['results' => 'array'];
    }

    /** @return BelongsTo<Exercise, $this> */
    public function exercise(): BelongsTo
    {
        return $this->belongsTo(Exercise::class);
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
