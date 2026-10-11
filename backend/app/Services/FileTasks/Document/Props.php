<?php

declare(strict_types=1);

namespace App\Services\FileTasks\Document;

/**
 * Egy bekezdes vagy szovegresz formazasi tulajdonsagai. Ami nincs megadva, az
 * `null` (orokles); a StyleResolver rakja egymasra a rétegeket.
 *
 * Kulcsok: font, size_pt, bold, italic, underline, small_caps, superscript,
 * subscript, color, alignment, space_before_pt, space_after_pt, line_kind,
 * line_value, indent_left_mm, indent_first_mm, hyphenation, page_break_before,
 * num_id, num_level.
 */
final readonly class Props
{
    /**
     * @param  array<string, string|float|bool>  $values
     * @param  list<TabStop>  $tabs
     */
    public function __construct(
        private array $values = [],
        private array $tabs = [],
    ) {}

    public function with(string $key, string|float|bool|null $value): self
    {
        if ($value === null) {
            return $this;
        }

        return new self([...$this->values, $key => $value], $this->tabs);
    }

    /** @param  list<TabStop>  $tabs */
    public function withTabs(array $tabs): self
    {
        return new self($this->values, [...$this->tabs, ...$tabs]);
    }

    /** A masik reteg tulajdonsagai felulirjak a sajatjaimat; a tabulatorok egyesulnek (azonos pozicio: a felso nyer, "clear" torol). */
    public function overlay(self $top): self
    {
        $tabs = $this->tabs;

        foreach ($top->tabs as $tab) {
            $tabs = array_values(array_filter(
                $tabs,
                static fn (TabStop $existing): bool => abs($existing->positionMm - $tab->positionMm) > 0.05,
            ));

            if ($tab->type !== 'clear') {
                $tabs[] = $tab;
            }
        }

        return new self([...$this->values, ...$top->values], $tabs);
    }

    public function string(string $key): ?string
    {
        $value = $this->values[$key] ?? null;

        return is_string($value) ? $value : null;
    }

    public function float(string $key): ?float
    {
        $value = $this->values[$key] ?? null;

        return is_float($value) ? $value : null;
    }

    public function bool(string $key): ?bool
    {
        $value = $this->values[$key] ?? null;

        return is_bool($value) ? $value : null;
    }

    /** @return list<TabStop> */
    public function tabs(): array
    {
        return $this->tabs;
    }
}
