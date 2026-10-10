<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\ExamAttemptState;
use App\Enums\ExamMode;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * Egy diak probalkozasa egy vizsgan.
 *
 * Felhasznalonkent es vizsgankent legfeljebb egy nyitott probalkozas lehet:
 * az `in_progress_marker` nyitott sornal true, lezartnal NULL, es egyedi
 * index van rajta. Aki a `state`-et lezarja, a jelolot is NULL-ra allitja.
 *
 * A `result` reszenkenti pillanatkep:
 *   [{part_id, order, score, max_score, raw_score, raw_max, summary,
 *     file_submission_id, submission_id}]
 *
 * @property int $id
 * @property int $user_id
 * @property int $exam_id
 * @property ExamMode $mode
 * @property ExamAttemptState $state
 * @property bool|null $in_progress_marker true, amig nyitott; kulonben NULL.
 * @property CarbonImmutable|Carbon $started_at
 * @property CarbonImmutable|Carbon|null $deadline_at Vizsgahelyzetben a szerver szerinti hatarido; gyakorlasnal NULL.
 * @property CarbonImmutable|Carbon|null $submitted_at
 * @property CarbonImmutable|Carbon|null $evaluated_at
 * @property CarbonImmutable|Carbon $last_activity_at
 * @property int|null $score Vizsgapont az atvaltas utan; az ertekelesig NULL.
 * @property int|null $max_score
 * @property int $pending_manual_points Meg meg nem jelolt kezi pontokbol szerezheto vizsgapont.
 * @property list<array<string, mixed>>|null $result
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read User $user
 * @property-read Exam $exam
 */
final class ExamAttempt extends Model
{
    protected $fillable = [
        'user_id', 'exam_id', 'mode', 'state', 'in_progress_marker',
        'started_at', 'deadline_at', 'submitted_at', 'evaluated_at', 'last_activity_at',
        'score', 'max_score', 'pending_manual_points', 'result',
    ];

    /** @var array<string, mixed> */
    protected $attributes = [
        'state' => 'in_progress',
        'pending_manual_points' => 0,
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'mode' => ExamMode::class,
            'state' => ExamAttemptState::class,
            'in_progress_marker' => 'boolean',
            'started_at' => 'datetime',
            'deadline_at' => 'datetime',
            'submitted_at' => 'datetime',
            'evaluated_at' => 'datetime',
            'last_activity_at' => 'datetime',
            'score' => 'integer',
            'max_score' => 'integer',
            'pending_manual_points' => 'integer',
            'result' => 'array',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return BelongsTo<Exam, $this> */
    public function exam(): BelongsTo
    {
        return $this->belongsTo(Exam::class);
    }

    /**
     * A probalkozasban feltoltott fajlok, reszenkent legfeljebb egy.
     *
     * @return HasMany<FileSubmission, $this>
     */
    public function fileSubmissions(): HasMany
    {
        return $this->hasMany(FileSubmission::class);
    }

    /**
     * Nyitott probalkozasok.
     *
     * @param  Builder<ExamAttempt>  $query
     */
    #[Scope]
    protected function open(Builder $query): void
    {
        $query->where('state', ExamAttemptState::InProgress);
    }

    public function isOpen(): bool
    {
        return $this->state->isOpen();
    }
}
