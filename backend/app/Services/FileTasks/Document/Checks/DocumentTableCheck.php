<?php

declare(strict_types=1);

namespace App\Services\FileTasks\Document\Checks;

use App\Enums\RubricCheckType;
use App\Services\FileTasks\CheckOutcome;
use App\Services\FileTasks\Document\DocumentModel;
use App\Services\FileTasks\Document\DocumentSelector;
use App\Services\FileTasks\Document\TableInfo;
use App\Services\FileTasks\Document\Words;
use App\Services\FileTasks\Grammar\Booleans;
use App\Services\FileTasks\Grammar\Colors;
use App\Services\FileTasks\Grammar\Lengths;

/**
 * Táblázat: sorok, oszlopok, szegély, szélesség, magasság, árnyékolás,
 * igazítás. Szelektor nélkül az első táblázatot nézi (`[table=N]`: az N-edik).
 */
final class DocumentTableCheck extends AbstractDocumentCheck
{
    public function type(): RubricCheckType
    {
        return RubricCheckType::DocumentTable;
    }

    protected function properties(): array
    {
        return array_fill_keys(['rows', 'columns', 'border', 'width', 'height', 'shading', 'alignment'], ['table']);
    }

    protected function expectedError(string $key, string $expected, ?DocumentSelector $selector): ?string
    {
        return match ($key) {
            'rows', 'columns' => $this->countError($expected),
            'border' => $this->booleanError($expected),
            'width', 'height' => $this->lengthError($expected),
            'shading' => Booleans::parse($expected) === null && Colors::parse($expected) === null
                ? $this->message('error.expected_shading')
                : null,
            default => in_array(Words::alignment($expected), ['left', 'center', 'right'], true)
                ? null
                : $this->message('error.expected_table_alignment'),
        };
    }

    protected function inspect(DocumentModel $document, string $key, ?DocumentSelector $selector, string $expected): CheckOutcome
    {
        $table = $document->tables[($selector->index ?? 1) - 1] ?? null;

        if ($table === null) {
            return CheckOutcome::fail();
        }

        return match ($key) {
            'rows' => new CheckOutcome($table->rows === (int) $expected, $this->found($key, (string) $table->rows)),
            'columns' => new CheckOutcome($table->columns === (int) $expected, $this->found($key, (string) $table->columns)),
            'border' => new CheckOutcome($table->border === Booleans::parse($expected), $this->found($key, $this->yesNo($table->border))),
            'width' => $this->length($key, $table->widthMm, $expected),
            'height' => $this->length($key, $table->heightMm, $expected),
            'shading' => $this->shading($table, $expected),
            default => new CheckOutcome(
                Words::alignment($expected) === $table->alignment,
                $this->found($key, Words::label('alignment', $table->alignment)),
            ),
        };
    }

    private function length(string $key, ?float $foundMm, string $expected): CheckOutcome
    {
        $wanted = $this->lengthMm($expected);

        if ($foundMm === null || $wanted === null) {
            return CheckOutcome::fail();
        }

        return new CheckOutcome(Lengths::close($foundMm, $wanted), $this->found($key, Lengths::format($foundMm)));
    }

    /** `igen`/`nem`: van-e kitöltött cella; szín: valamelyik cella ilyen színű. */
    private function shading(TableInfo $table, string $expected): CheckOutcome
    {
        $found = $table->shadingColors === []
            ? $this->yesNo(false)
            : implode(', ', array_map(Colors::format(...), array_slice($table->shadingColors, 0, 4)));
        $wantedBool = Booleans::parse($expected);

        if ($wantedBool !== null) {
            return new CheckOutcome(($table->shadingColors !== []) === $wantedBool, $this->found('shading', $found));
        }

        $wanted = Colors::parse($expected);

        if ($wanted === null) {
            return CheckOutcome::fail();
        }

        foreach ($table->shadingColors as $color) {
            if (Colors::close($color, $wanted)) {
                return CheckOutcome::pass($this->found('shading', $found));
            }
        }

        return CheckOutcome::fail($this->found('shading', $found));
    }
}
