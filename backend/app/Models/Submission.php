<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\Verdict;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $exercise_id
 * @property list<array<string, mixed>>|null $results Tesztesetenkenti eredmenyek, a rejtettek adatai nelkul.
 * @property Verdict|null $verdict A #39 elotti beadasoknal NULL.
 * @property int|null $score Reszfeladatos feladatnal a megszerzett pont, kulonben a teljesult tesztesetek szama; regi sorokon NULL.
 * @property int|null $max_score Az elerheto pont, illetve a lefutott tesztesetek szama; regi sorokon NULL.
 * @property list<array{label: string, points: int, max_points: int, passed: bool}>|null $subtasks Reszfeladatonkenti eredmeny, vart es kapott szoveg nelkul.
 */
final class Submission extends Model
{
    protected $fillable = [
        'user_id', 'exercise_id', 'language', 'source_code', 'status', 'verdict', 'results',
        'score', 'max_score', 'subtasks',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'results' => 'array',
            'verdict' => Verdict::class,
            'score' => 'integer',
            'max_score' => 'integer',
            'subtasks' => 'array',
        ];
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
