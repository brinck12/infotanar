<?php

declare(strict_types=1);

namespace App\Services\Catalog\Spec;

use Illuminate\Validation\Rule;

/**
 * Egy bongeszos ellenorzes (check) tipusfuggo mezoje: a validacios szabalyai
 * es az, hogy milyen tipusra all be mentes elott.
 */
final readonly class CheckField
{
    private const TEXT = 'text';

    private const INTEGER = 'integer';

    private const NUMBER = 'number';

    /** @param list<mixed> $rules */
    private function __construct(
        private string $type,
        private array $rules,
        private bool $required = true,
    ) {}

    /** Szoveg, legfeljebb `$max` karakter; `$pattern` megadasakor a regularis kifejezesre is illeszkednie kell. */
    public static function text(int $max, ?string $pattern = null): self
    {
        return new self(self::TEXT, ['string', "max:{$max}", ...($pattern === null ? [] : ["regex:{$pattern}"])]);
    }

    /** A felsorolt szovegek egyike. */
    public static function oneOf(string ...$values): self
    {
        return new self(self::TEXT, ['string', Rule::in($values)]);
    }

    public static function integer(int $min, int $max): self
    {
        return new self(self::INTEGER, ['integer', "between:{$min},{$max}"]);
    }

    public static function number(float $min, float $max): self
    {
        return new self(self::NUMBER, ['numeric', "between:{$min},{$max}"]);
    }

    /** Elhagyhato mezo: hianyozhat vagy lehet null, es ilyenkor a mentett adatbol is kimarad. */
    public function optional(): self
    {
        return new self($this->type, $this->rules, required: false);
    }

    /** @return list<mixed> */
    public function rules(): array
    {
        return [$this->required ? 'required' : 'nullable', ...$this->rules];
    }

    /** Az ertek a mezo tipusaban; null, ha hianyzik (elhagyhato mezonel). */
    public function cast(mixed $value): string|int|float|null
    {
        return match ($this->type) {
            self::INTEGER => SpecValue::nullableInteger($value),
            self::NUMBER => SpecValue::number($value),
            default => SpecValue::nullableString($value),
        };
    }
}
