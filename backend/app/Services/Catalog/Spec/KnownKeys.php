<?php

declare(strict_types=1);

namespace App\Services\Catalog\Spec;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * A `spec` egy objektumaban csak a felsorolt kulcsok szerepelhetnek. Az
 * ismeretlen kulcsot nem dobjuk el csendben: egy elgepelt mezonev (pl.
 * `accepted_extension`) kulonben eszrevetlenul veszne el.
 */
final readonly class KnownKeys implements ValidationRule
{
    /** @param list<string> $keys */
    public function __construct(private array $keys) {}

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_array($value)) {
            return;
        }

        $unknown = array_diff(array_map(strval(...), array_keys($value)), $this->keys);

        if ($unknown !== []) {
            $fail(__('catalog.spec.unknown_key', ['keys' => implode(', ', $unknown)]));
        }
    }
}
