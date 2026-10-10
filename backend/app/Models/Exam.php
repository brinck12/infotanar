<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Support\Carbon;

/**
 * Gyakorlo vizsga: egy hivatalos feladatsor rendezett reszekkel. A diak
 * probalkozast (ExamAttempt) indit rajta, vizsgahelyzetben vagy gyakorlaskent.
 *
 * @property int $id
 * @property string $session Vizsgaidoszak: EEEE-05 vagy EEEE-10.
 * @property string $title Pl. "2026. május" (a szintet a frontend teszi hozza).
 * @property string $level `kozep` vagy `emelt`.
 * @property int $minutes A vizsga hossza percben.
 * @property int $points Osszpontszam; publikalaskor egyeznie kell a reszek pontjainak osszegevel.
 * @property bool $is_published
 * @property bool $timed_mode Engedelyezett-e a vizsgahelyzet (ExamMode::Exam).
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
final class Exam extends Model
{
    protected $fillable = ['session', 'title', 'level', 'minutes', 'points', 'is_published', 'timed_mode'];

    /** @var array<string, mixed> */
    protected $attributes = [
        'is_published' => false,
        'timed_mode' => true,
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'minutes' => 'integer',
            'points' => 'integer',
            'is_published' => 'boolean',
            'timed_mode' => 'boolean',
        ];
    }

    /** @return HasMany<ExamPart, $this> */
    public function parts(): HasMany
    {
        return $this->hasMany(ExamPart::class)->orderBy('position');
    }

    /** @return HasMany<ExamAttempt, $this> */
    public function attempts(): HasMany
    {
        return $this->hasMany(ExamAttempt::class);
    }

    /**
     * A vizsga fajljai (ma csak a `source_zip`).
     *
     * @return MorphMany<Attachment, $this>
     */
    public function attachments(): MorphMany
    {
        return $this->morphMany(Attachment::class, 'attachable')->orderBy('position')->orderBy('id');
    }

    /** @param Builder<Exam> $query */
    #[Scope]
    protected function published(Builder $query): void
    {
        $query->where('is_published', true);
    }
}
