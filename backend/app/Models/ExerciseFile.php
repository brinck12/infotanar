<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Feladathoz mellekelt adatfajl (#152). A tartalom base64-kent tarolodik, hogy
 * tetszoleges bajtsor (pl. Latin-2 szoveg) valtozatlanul megmaradjon.
 *
 * @property int $id
 * @property int $exercise_id
 * @property int|null $test_case_id Null: kozos fajl; kulonben csak ennel a tesztesetnel van jelen.
 * @property string $name
 * @property string $content Base64.
 * @property int $size A fajl merete bajtban.
 * @property string $sha256
 */
final class ExerciseFile extends Model
{
    protected $fillable = ['exercise_id', 'test_case_id', 'name', 'content', 'size', 'sha256'];

    /** A tartalom (akar 256 KB) sosem kerul kozvetlenul JSON-ba: a resource-ok valasztjak ki a mezoket. */
    protected $hidden = ['content'];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return ['size' => 'integer'];
    }

    /** A fajl nyers bajtjai. */
    public function bytes(): string
    {
        return (string) base64_decode($this->content, true);
    }

    public function isShared(): bool
    {
        return $this->test_case_id === null;
    }

    /** @return BelongsTo<Exercise, $this> */
    public function exercise(): BelongsTo
    {
        return $this->belongsTo(Exercise::class);
    }

    /** @return BelongsTo<TestCase, $this> */
    public function testCase(): BelongsTo
    {
        return $this->belongsTo(TestCase::class);
    }
}
