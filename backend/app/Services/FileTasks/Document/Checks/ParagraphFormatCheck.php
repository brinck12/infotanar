<?php

declare(strict_types=1);

namespace App\Services\FileTasks\Document\Checks;

use App\Enums\RubricCheckType;
use App\Services\FileTasks\CheckOutcome;
use App\Services\FileTasks\Document\DocumentModel;
use App\Services\FileTasks\Document\DocumentSelector;
use App\Services\FileTasks\Document\ParagraphInfo;
use App\Services\FileTasks\Document\Units;
use App\Services\FileTasks\Document\Words;
use App\Services\FileTasks\Grammar\Booleans;
use App\Services\FileTasks\Grammar\Lengths;
use App\Services\FileTasks\Grammar\Numbers;
use App\Services\FileTasks\Grammar\Text;

/**
 * Bekezdésformázás: igazítás, térköz előtte/utána, sorköz, behúzás, elválasztás,
 * oldaltörés előtte. Az érték stílusokkal feloldva számít.
 */
final class ParagraphFormatCheck extends AbstractDocumentCheck
{
    /** Szóval írt sorközök. */
    private const LINE_WORDS = ['egyszeres' => 1.0, 'masfeles' => 1.5, 'dupla' => 2.0, 'kettes' => 2.0];

    public function type(): RubricCheckType
    {
        return RubricCheckType::ParagraphFormat;
    }

    protected function properties(): array
    {
        return array_fill_keys(
            ['alignment', 'space_before', 'space_after', 'line_spacing', 'indent_left', 'indent_first', 'hyphenation', 'page_break_before'],
            self::PARAGRAPH_SELECTORS,
        );
    }

    protected function expectedError(string $key, string $expected, ?DocumentSelector $selector): ?string
    {
        return match ($key) {
            'alignment' => Words::alignment($expected) === null ? $this->message('error.expected_alignment') : null,
            'line_spacing' => $this->lineSpacing($expected) === null ? $this->message('error.expected_line_spacing') : null,
            'hyphenation', 'page_break_before' => $this->booleanError($expected),
            default => $this->lengthError($expected),
        };
    }

    protected function inspect(DocumentModel $document, string $key, ?DocumentSelector $selector, string $expected): CheckOutcome
    {
        return $this->eachParagraph($document, $selector, fn (ParagraphInfo $paragraph): ?CheckOutcome => $this->test($paragraph, $key, $expected));
    }

    private function test(ParagraphInfo $paragraph, string $key, string $expected): ?CheckOutcome
    {
        $props = $paragraph->props;

        switch ($key) {
            case 'alignment':
                $alignment = $props->string('alignment') ?? 'left';

                return new CheckOutcome(Words::alignment($expected) === $alignment, $this->found($key, Words::label('alignment', $alignment)));

            case 'space_before':
            case 'space_after':
                $points = $props->float($key === 'space_before' ? 'space_before_pt' : 'space_after_pt') ?? 0.0;

                return $this->lengthOutcome($key, Units::pointsToMillimetres($points), $expected, Numbers::format(round($points, 1)).' pt');

            case 'indent_left':
            case 'indent_first':
                $millimetres = $props->float($key === 'indent_left' ? 'indent_left_mm' : 'indent_first_mm') ?? 0.0;

                return $this->lengthOutcome($key, $millimetres, $expected, Lengths::format($millimetres));

            case 'line_spacing':
                return $this->lineSpacingOutcome($paragraph, $expected);

            default:
                $flag = $props->bool($key === 'hyphenation' ? 'hyphenation' : 'page_break_before') ?? false;

                return new CheckOutcome($flag === Booleans::parse($expected), $this->found($key, $this->yesNo($flag)));
        }
    }

    private function lengthOutcome(string $key, float $foundMm, string $expected, string $display): ?CheckOutcome
    {
        $wanted = $this->lengthMm($expected);

        return $wanted === null ? null : new CheckOutcome(Lengths::close($foundMm, $wanted), $this->found($key, $display));
    }

    private function lineSpacingOutcome(ParagraphInfo $paragraph, string $expected): ?CheckOutcome
    {
        $wanted = $this->lineSpacing($expected);

        if ($wanted === null) {
            return null;
        }

        $kind = $paragraph->props->string('line_kind') ?? 'multiple';
        $value = $paragraph->props->float('line_value') ?? 1.0;

        $display = $kind === 'multiple'
            ? __('filetasks_document.line_multiple', ['value' => Numbers::format(round($value, 2))])
            : __('filetasks_document.line_fixed.'.$kind, ['value' => Numbers::format(round($value, 1))]);

        if ($wanted[0] === 'multiple') {
            return new CheckOutcome($kind === 'multiple' && Numbers::close($value, $wanted[1]), $this->found('line_spacing', $display));
        }

        return new CheckOutcome(
            $kind !== 'multiple' && Lengths::close(Units::pointsToMillimetres($value), $wanted[1]),
            $this->found('line_spacing', $display),
        );
    }

    /**
     * Az elvárt sorköz: szám (szoros szorzó, 1,5), szó (egyszeres, másfeles,
     * dupla) vagy mértékegységes hossz (18 pt: pontosan/legalább).
     *
     * @return array{string, float}|null ['multiple', szorzó] vagy ['length', mm]
     */
    private function lineSpacing(string $expected): ?array
    {
        $word = self::LINE_WORDS[str_replace(' ', '', Text::fold($expected))] ?? null;

        if ($word !== null) {
            return ['multiple', $word];
        }

        $length = Lengths::toMillimetres($expected);

        if ($length !== null) {
            return ['length', $length];
        }

        $multiple = Numbers::parse($expected);

        return $multiple !== null && $multiple > 0 ? ['multiple', $multiple] : null;
    }
}
