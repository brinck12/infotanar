<?php

declare(strict_types=1);

namespace App\Casts;

use App\Services\Execution\Comparison\ComparisonSettings;
use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Database\Eloquent\Model;

/**
 * exercises.comparison (JSON) <-> ComparisonSettings. Az alapertelmezes (pontos
 * osszevetes, nincs opcio) NULL-kent tarolodik, igy a meglevo feladatok sora nem valtozik.
 *
 * @implements CastsAttributes<ComparisonSettings, ComparisonSettings|array<mixed>|null>
 */
final class AsComparisonSettings implements CastsAttributes
{
    /** @param array<string, mixed> $attributes */
    public function get(Model $model, string $key, mixed $value, array $attributes): ComparisonSettings
    {
        if (! is_string($value) || $value === '') {
            return ComparisonSettings::exact();
        }

        $decoded = json_decode($value, true, flags: JSON_THROW_ON_ERROR);

        return is_array($decoded) ? ComparisonSettings::fromArray($decoded) : ComparisonSettings::exact();
    }

    /** @param array<string, mixed> $attributes */
    public function set(Model $model, string $key, mixed $value, array $attributes): ?string
    {
        $settings = match (true) {
            $value === null => ComparisonSettings::exact(),
            $value instanceof ComparisonSettings => $value,
            default => ComparisonSettings::fromArray($value),
        };

        return $settings->isDefault() ? null : json_encode($settings->toArray(), JSON_THROW_ON_ERROR);
    }
}
