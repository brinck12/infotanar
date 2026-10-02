<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * Egy folyamatban levo, darabokban feltoltott leckevideo (#158).
 *
 * @property string $id
 * @property int $lesson_id
 * @property int|null $user_id
 * @property string $filename
 * @property int $size A teljes fajl merete bajtban.
 * @property int $part_size Egy darab merete bajtban (az utolso rovidebb lehet).
 * @property int $total_parts
 * @property Carbon|null $created_at
 * @property-read Lesson $lesson A lesson_id NOT NULL + cascade: a lecke mindig letezik.
 */
final class LessonUpload extends Model
{
    use HasUuids;

    protected $fillable = ['lesson_id', 'user_id', 'filename', 'size', 'part_size', 'total_parts'];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return ['size' => 'integer', 'part_size' => 'integer', 'total_parts' => 'integer'];
    }

    /** A megadott sorszamu darab varhato merete bajtban: az utolso darab a maradek. */
    public function expectedPartLength(int $part): int
    {
        return $part < $this->total_parts ? $this->part_size : $this->size - $this->part_size * ($this->total_parts - 1);
    }

    /** @return BelongsTo<Lesson, $this> */
    public function lesson(): BelongsTo
    {
        return $this->belongsTo(Lesson::class);
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
