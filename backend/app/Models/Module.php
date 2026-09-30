<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

/**
 * Egy track temakore (pl. Programozási tételek). A v1 API-ban "topic" neven szerepel.
 *
 * Az oszlopok explicit dokumentaltak: a tabla atnevezessel (topics -> modules)
 * jott letre, amit a statikus elemzo a migraciokbol nem tud kovetni.
 *
 * @property int $id
 * @property int $track_id
 * @property string $slug
 * @property string $title
 * @property string|null $description
 * @property int $position
 */
final class Module extends Model
{
    protected $fillable = ['track_id', 'slug', 'title', 'description', 'position'];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return ['position' => 'integer'];
    }

    /** @return BelongsTo<Track, $this> */
    public function track(): BelongsTo
    {
        return $this->belongsTo(Track::class);
    }

    /** @return HasMany<Lesson, $this> */
    public function lessons(): HasMany
    {
        return $this->hasMany(Lesson::class)->orderBy('position');
    }

    /** @return HasManyThrough<Exercise, Lesson, $this> */
    public function exercises(): HasManyThrough
    {
        return $this->hasManyThrough(Exercise::class, Lesson::class);
    }
}
