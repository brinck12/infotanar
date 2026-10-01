<?php

declare(strict_types=1);

namespace App\Services\Execution\Comparison;

use App\Enums\ComparisonMode;

/**
 * Egy feladat kimenet-osszevetesi beallitasai (#155). Tarolasi alak
 * (exercises.comparison, NULL = alapertelmezes):
 *
 *     { "mode": "numeric", "abs_tol": 0.01, "rel_tol": 0, "case_insensitive": false, "ignore_blank_lines": false }
 *
 * A turesek csak `numeric` modban szamitanak. A nem ismert kulcsokat figyelmen
 * kivul hagyjuk, a hianyzokat az alapertek potolja: az ervenyesseget a
 * FormRequest ellenorzi, itt nincs mit elrontani.
 */
final readonly class ComparisonSettings
{
    public function __construct(
        public ComparisonMode $mode = ComparisonMode::Exact,
        /** Abszolut tures: |a - b| legfeljebb ennyi. */
        public float $absTol = 0.0,
        /** Relativ tures: |a - b| legfeljebb ennyi szorosa a nagyobb abszolut erteknek. */
        public float $relTol = 0.0,
        public bool $caseInsensitive = false,
        public bool $ignoreBlankLines = false,
    ) {}

    /** A korabbi viselkedes: soronkenti, pontos osszevetes. */
    public static function exact(): self
    {
        return new self;
    }

    /** @param array<mixed> $data */
    public static function fromArray(array $data): self
    {
        $mode = is_string($data['mode'] ?? null) ? ComparisonMode::tryFrom($data['mode']) : null;

        return new self(
            $mode ?? ComparisonMode::Exact,
            self::float($data['abs_tol'] ?? 0),
            self::float($data['rel_tol'] ?? 0),
            ($data['case_insensitive'] ?? false) === true,
            ($data['ignore_blank_lines'] ?? false) === true,
        );
    }

    /** Az alapertek nem kerul az adatbazisba: a meglevo feladatok sora NULL marad. */
    public function isDefault(): bool
    {
        return $this->mode === ComparisonMode::Exact && ! $this->caseInsensitive && ! $this->ignoreBlankLines;
    }

    /** @return array{mode: string, abs_tol: float, rel_tol: float, case_insensitive: bool, ignore_blank_lines: bool} */
    public function toArray(): array
    {
        return [
            'mode' => $this->mode->value,
            'abs_tol' => $this->absTol,
            'rel_tol' => $this->relTol,
            'case_insensitive' => $this->caseInsensitive,
            'ignore_blank_lines' => $this->ignoreBlankLines,
        ];
    }

    /**
     * A diaknak szolo szabalyok, magyarul (a feladat leirasa alatt jelennek meg).
     * Az alapertelmezett (pontos) osszevetesnel ures.
     *
     * @return list<string>
     */
    public function describe(): array
    {
        $rules = [];

        if ($this->mode === ComparisonMode::Tokens) {
            $rules[] = __('execution.comparison.tokens');
        }

        if ($this->mode === ComparisonMode::Numeric) {
            $rules[] = $this->describeNumeric();
        }

        if ($this->ignoreBlankLines && $this->mode === ComparisonMode::Exact) {
            $rules[] = __('execution.comparison.ignore_blank_lines');
        }

        if ($this->caseInsensitive) {
            $rules[] = __('execution.comparison.case_insensitive');
        }

        return $rules;
    }

    private function describeNumeric(): string
    {
        $parts = [];

        if ($this->absTol > 0) {
            $parts[] = __('execution.comparison.abs_tol', ['tolerance' => self::format($this->absTol)]);
        }

        if ($this->relTol > 0) {
            $parts[] = __('execution.comparison.rel_tol', ['percent' => self::format($this->relTol * 100)]);
        }

        return $parts === []
            ? __('execution.comparison.numeric_exact')
            : __('execution.comparison.numeric', ['tolerance' => implode(__('execution.comparison.or'), $parts)]);
    }

    /** Magyar tizedesvesszos szam, felesleges nullak nelkul: 0.01 -> "0,01", 5.0 -> "5". */
    private static function format(float $value): string
    {
        return str_replace('.', ',', rtrim(rtrim(number_format($value, 6, '.', ''), '0'), '.'));
    }

    private static function float(mixed $value): float
    {
        return is_numeric($value) ? max(0.0, (float) $value) : 0.0;
    }
}
