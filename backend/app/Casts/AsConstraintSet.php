<?php

declare(strict_types=1);

namespace App\Casts;

use App\Services\Constraints\ConstraintSet;
use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Database\Eloquent\Model;

/**
 * exercises.constraints (JSON) <-> ConstraintSet. Ervenytelen szabaly mar
 * mentesnel hibat dob, igy az adatbazisba csak ellenorzott alak kerulhet.
 *
 * @implements CastsAttributes<ConstraintSet, ConstraintSet|array<mixed>|null>
 */
final class AsConstraintSet implements CastsAttributes
{
    /** @param array<string, mixed> $attributes */
    public function get(Model $model, string $key, mixed $value, array $attributes): ConstraintSet
    {
        if (! is_string($value) || $value === '') {
            return ConstraintSet::none();
        }

        $decoded = json_decode($value, true, flags: JSON_THROW_ON_ERROR);

        return is_array($decoded) ? ConstraintSet::fromArray($decoded) : ConstraintSet::none();
    }

    /** @param array<string, mixed> $attributes */
    public function set(Model $model, string $key, mixed $value, array $attributes): ?string
    {
        $set = match (true) {
            $value === null => ConstraintSet::none(),
            $value instanceof ConstraintSet => $value,
            default => ConstraintSet::fromArray($value),
        };

        return $set->isEmpty() ? null : json_encode($set->toArray(), JSON_THROW_ON_ERROR);
    }
}
