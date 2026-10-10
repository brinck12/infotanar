<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\RubricCheckType;
use App\Enums\RubricMode;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * Egy fajlfeladat ertekelolapjanak egy pontja: mit vizsgalunk, mennyit er, es
 * automatikus vagy kezi-e.
 *
 * A `property` es az `expected` szoveges nyelvtanat a tipus kezeloje adja
 * (App\Services\FileTasks\CheckHandler::validate); mentes elott az
 * App\Services\FileTasks\RubricCheckCatalog ellenorzi.
 *
 * @property int $id
 * @property int $exercise_id
 * @property int $position 0..n-1 a feladaton belul (SiblingOrder).
 * @property string $group A lapon savkent megjeleno csoport; az ures "Egyéb"-kent latszik.
 * @property string $label
 * @property RubricCheckType $check_type
 * @property string $property Mit vizsgalunk (kezi pontnal lehet ures).
 * @property string $expected Az elvart ertek (lehet ures).
 * @property int $points Nyers pont, legalabb 1.
 * @property RubricMode $mode
 * @property string|null $hint Mit javitson a diak, ha a pont nem teljesult.
 * @property array<string, mixed>|null $params Strukturalt bovites; a mai urlap nem kuldi.
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Exercise $exercise
 */
final class RubricItem extends Model
{
    protected $fillable = [
        'exercise_id', 'position', 'group', 'label', 'check_type',
        'property', 'expected', 'points', 'mode', 'hint', 'params',
    ];

    /** @var array<string, mixed> */
    protected $attributes = [
        'group' => '',
        'property' => '',
        'expected' => '',
        'mode' => 'auto',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'check_type' => RubricCheckType::class,
            'mode' => RubricMode::class,
            'position' => 'integer',
            'points' => 'integer',
            'params' => 'array',
        ];
    }

    /** @return BelongsTo<Exercise, $this> */
    public function exercise(): BelongsTo
    {
        return $this->belongsTo(Exercise::class);
    }

    /**
     * Kezi pont: a diak veti ossze a mintaval. A `manual` tipus mindig kezi,
     * akkor is, ha a `mode` oszlop mast mondana.
     */
    public function isManual(): bool
    {
        return $this->mode === RubricMode::Manual || $this->check_type->isManual();
    }
}
