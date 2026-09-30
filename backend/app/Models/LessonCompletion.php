<?php

declare(strict_types=1);

namespace App\Models;

use Carbon\CarbonImmutable;
use Database\Factories\LessonCompletionFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * Egy felhasznalo teljesitett egy leckét. A (user_id, lesson_id) par egyedi;
 * a rekord a legelso teljesites idopontjat orzi.
 *
 * @property CarbonImmutable|Carbon $completed_at
 */
final class LessonCompletion extends Model
{
    /** @use HasFactory<LessonCompletionFactory> */
    use HasFactory;

    public $timestamps = false;

    protected $fillable = ['user_id', 'lesson_id', 'completed_at'];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return ['completed_at' => 'datetime'];
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return BelongsTo<Lesson, $this> */
    public function lesson(): BelongsTo
    {
        return $this->belongsTo(Lesson::class);
    }
}
