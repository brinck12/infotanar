<?php

declare(strict_types=1);

namespace App\Services\Constraints;

use App\Enums\RequiredConstruct;
use InvalidArgumentException;

/**
 * Egy feladat statikus kodszabalyai (#42). Tarolasi alak (exercises.constraints):
 *
 *     { "require": ["for_loop"], "forbid": ["builtin:sum", "method:count"] }
 *
 *  - require: RequiredConstruct ertekek (for_loop, while_loop, loop, recursion)
 *  - forbid:  "builtin:<nev>" (pl. sum, sorted, max) vagy "method:<nev>"
 *             (pl. count, sort, index)
 *
 * Az erettsegi tipikus kovetelmenye: "valositsd meg a tetelt, ne a beepitett
 * rovidítest hivd". Jelenleg a Python megoldasokra ellenorizzuk (#43).
 */
final readonly class ConstraintSet
{
    /**
     * @param  list<RequiredConstruct>  $require
     * @param  list<Prohibition>  $forbid
     */
    private function __construct(
        public array $require,
        public array $forbid,
    ) {}

    public static function none(): self
    {
        return new self([], []);
    }

    /**
     * @param  array<mixed>  $data
     *
     * @throws InvalidArgumentException
     */
    public static function fromArray(array $data): self
    {
        $unknown = array_diff(array_keys($data), ['require', 'forbid']);
        if ($unknown !== []) {
            throw new InvalidArgumentException('Ismeretlen szabálykulcs: '.implode(', ', $unknown).'.');
        }

        $require = [];
        foreach (self::stringList($data['require'] ?? [], 'require') as $value) {
            $require[$value] = RequiredConstruct::tryFrom($value)
                ?? throw new InvalidArgumentException("Ismeretlen kötelező szerkezet: \"{$value}\".");
        }

        $forbid = [];
        foreach (self::stringList($data['forbid'] ?? [], 'forbid') as $value) {
            $prohibition = Prohibition::parse($value);
            $forbid[$prohibition->key()] = $prohibition;
        }

        // A kulcsok miatt ismetlodes nem marad.
        return new self(array_values($require), array_values($forbid));
    }

    public function isEmpty(): bool
    {
        return $this->require === [] && $this->forbid === [];
    }

    /** @return array{require: list<string>, forbid: list<string>} */
    public function toArray(): array
    {
        return [
            'require' => array_map(static fn (RequiredConstruct $r): string => $r->value, $this->require),
            'forbid' => array_map(static fn (Prohibition $p): string => $p->key(), $this->forbid),
        ];
    }

    /**
     * Magyar, diaknak szolo leiras (pl. "for ciklust kell használnod").
     *
     * @return list<string>
     */
    public function describe(): array
    {
        return [
            ...array_map(static fn (RequiredConstruct $r): string => $r->describe(), $this->require),
            ...array_map(static fn (Prohibition $p): string => $p->describe(), $this->forbid),
        ];
    }

    /**
     * @return list<string>
     *
     * @throws InvalidArgumentException
     */
    private static function stringList(mixed $value, string $key): array
    {
        if (! is_array($value) || ! array_is_list($value)) {
            throw new InvalidArgumentException("A(z) \"{$key}\" értéke lista legyen.");
        }

        $strings = [];
        foreach ($value as $item) {
            if (! is_string($item)) {
                throw new InvalidArgumentException("A(z) \"{$key}\" elemei szövegek legyenek.");
            }
            $strings[] = $item;
        }

        return $strings;
    }
}
