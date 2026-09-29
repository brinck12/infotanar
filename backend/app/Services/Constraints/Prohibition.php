<?php

declare(strict_types=1);

namespace App\Services\Constraints;

use InvalidArgumentException;

/**
 * Tiltott hivas: beepitett fuggveny (`builtin:sum`) vagy metodus
 * (`method:count`, azaz `valami.count(...)`).
 */
final readonly class Prohibition
{
    public const BUILTIN = 'builtin';

    public const METHOD = 'method';

    private function __construct(
        public string $kind,
        public string $name,
    ) {}

    /** @throws InvalidArgumentException */
    public static function parse(string $rule): self
    {
        if (preg_match('/^(builtin|method):([A-Za-z_][A-Za-z0-9_]*)$/', $rule, $m) !== 1) {
            throw new InvalidArgumentException("Érvénytelen tiltás: \"{$rule}\" (formátum: builtin:<név> vagy method:<név>).");
        }

        return new self($m[1], $m[2]);
    }

    public function key(): string
    {
        return "{$this->kind}:{$this->name}";
    }

    public function describe(): string
    {
        return __("constraints.forbid.{$this->kind}", ['name' => $this->name]);
    }
}
