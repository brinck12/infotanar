<?php

declare(strict_types=1);

namespace App\Services\FileTasks\Spreadsheet;

use App\Services\FileTasks\Grammar\Booleans;
use App\Services\FileTasks\Grammar\Numbers;

/**
 * Egy cella, ahogy a fajl tarolja: az ertek (keplet eseten a fajlba mentett,
 * kiszamolt eredmeny), a keplet es a szamformatum. Kepletet nem szamolunk ujra.
 */
final readonly class Cell
{
    public function __construct(
        public CellType $type,
        /** Number: float; Text es Error: string; Boolean: bool; Blank: null. */
        public float|string|bool|null $value,
        /**
         * A keplet angol fuggvenynevekkel, A1 hivatkozasokkal, vesszovel
         * elvalasztott argumentumokkal, egyenlosegjel nelkul
         * (FormulaNormalizer); null, ha a cella allando.
         */
        public ?string $formula = null,
        /** Excel-szeru, angol jelolesu formatumkod ("0.00", "yyyy.mm.dd", "General"). */
        public string $numberFormat = NumberFormatCode::GENERAL,
    ) {}

    public function hasValue(): bool
    {
        return $this->type !== CellType::Blank;
    }

    public function hasFormula(): bool
    {
        return $this->formula !== null;
    }

    /** Az ertek szamkent, ha a cella szam. */
    public function number(): ?float
    {
        return $this->type === CellType::Number && is_float($this->value) ? $this->value : null;
    }

    /** Az ertek rovid szovegkent a diaknak (a `found` mezobe); ures cellanal ures szoveg. */
    public function display(): string
    {
        return match (true) {
            is_float($this->value) => $this->displayNumber($this->value),
            is_bool($this->value) => Booleans::format($this->value),
            is_string($this->value) => $this->value,
            default => '',
        };
    }

    private function displayNumber(float $value): string
    {
        $format = NumberFormatCode::parse($this->numberFormat);

        return $format->isDateTime() ? SerialDate::format($value, $format) : Numbers::format($value);
    }
}
