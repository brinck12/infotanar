<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\ExamPartKey;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * Egy vizsga egy resze. A reszhez tartozo feladat hordozza a szoveget, a
 * forrasfajlokat es az ertekelolapot (fajlos resz) vagy a teszteseteket
 * (szerkesztos resz).
 *
 * @property int $id
 * @property int $exam_id
 * @property int|null $exercise_id NULL, amig a szerkeszto nem rendelt hozza feladatot.
 * @property int $position 0..n-1 a vizsgan belul; az API-ban `order = position + 1`.
 * @property ExamPartKey $key
 * @property string $name
 * @property int $points Ennyi vizsgapontot er a resz.
 * @property int $minutes Ajanlott ido percben (nem korlat).
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Exam $exam
 * @property-read Exercise|null $exercise
 */
final class ExamPart extends Model
{
    protected $fillable = ['exam_id', 'exercise_id', 'position', 'key', 'name', 'points', 'minutes'];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'key' => ExamPartKey::class,
            'position' => 'integer',
            'points' => 'integer',
            'minutes' => 'integer',
        ];
    }

    /** @return BelongsTo<Exam, $this> */
    public function exam(): BelongsTo
    {
        return $this->belongsTo(Exam::class);
    }

    /** @return BelongsTo<Exercise, $this> */
    public function exercise(): BelongsTo
    {
        return $this->belongsTo(Exercise::class);
    }

    /**
     * A reszhez vizsgaban feltoltott fajlok (probalkozasonkent legfeljebb egy).
     *
     * @return HasMany<FileSubmission, $this>
     */
    public function fileSubmissions(): HasMany
    {
        return $this->hasMany(FileSubmission::class);
    }

    /** Az API-ban es a feluleten hasznalt, 1-tol szamolt sorszam. */
    public function order(): int
    {
        return $this->position + 1;
    }
}
