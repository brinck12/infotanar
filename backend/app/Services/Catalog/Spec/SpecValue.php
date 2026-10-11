<?php

declare(strict_types=1);

namespace App\Services\Catalog\Spec;

/**
 * Tipusos olvasas a `spec` JSON-bol. A bemenet a validacion mar atment, de a
 * szabalyok engedekenyek (az `integer` a "5" szoveget is elfogadja), a tarolt
 * adat pedig seederbol vagy importbol is johet: ezert itt minden ertek a
 * vegleges tipusara all be, es a hianyzo vagy rossz tipusu ertek alapertekre.
 */
final class SpecValue
{
    /**
     * Objektumkent hasznalt tomb (kulcs => ertek); mas tipus ures.
     *
     * @return array<string, mixed>
     */
    public static function map(mixed $value): array
    {
        $map = [];

        foreach (is_array($value) ? $value : [] as $key => $item) {
            $map[(string) $key] = $item;
        }

        return $map;
    }

    /**
     * Lista, ujraszamozott indexekkel; mas tipus ures.
     *
     * @return list<mixed>
     */
    public static function items(mixed $value): array
    {
        return is_array($value) ? array_values($value) : [];
    }

    /**
     * A lista szoveges elemei.
     *
     * @return list<string>
     */
    public static function strings(mixed $value): array
    {
        return array_values(array_filter(self::items($value), is_string(...)));
    }

    public static function string(mixed $value, string $default = ''): string
    {
        return is_string($value) ? $value : $default;
    }

    /** Ures szoveg helyett is null: a kliens a hianyzo erteket igy kapja egysegesen. */
    public static function nullableString(mixed $value): ?string
    {
        return is_string($value) && $value !== '' ? $value : null;
    }

    public static function integer(mixed $value, int $default = 0): int
    {
        return self::nullableInteger($value) ?? $default;
    }

    public static function nullableInteger(mixed $value): ?int
    {
        if (is_int($value)) {
            return $value;
        }

        return is_string($value) && preg_match('/^-?\d{1,9}$/', $value) === 1 ? (int) $value : null;
    }

    /** Szam: egesz marad egesz (a JSON-ban `12`, nem `12.0`). */
    public static function number(mixed $value): int|float|null
    {
        if (is_int($value) || is_float($value)) {
            return $value;
        }

        return is_string($value) && is_numeric($value) ? $value + 0 : null;
    }

    public static function boolean(mixed $value): bool
    {
        return in_array($value, [true, 1, '1'], true);
    }
}
