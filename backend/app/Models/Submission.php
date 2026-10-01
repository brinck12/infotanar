<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\Verdict;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $exercise_id
 * @property Verdict|null $verdict A #39 elotti beadasoknal NULL.
 * @property bool $assisted A beadas a mintamegoldas megnyitasa utan keszult (#154).
 */
final class Submission extends Model
{
    protected $fillable = ['user_id', 'exercise_id', 'language', 'source_code', 'status', 'verdict', 'assisted', 'results'];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return ['results' => 'array', 'verdict' => Verdict::class, 'assisted' => 'boolean'];
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
