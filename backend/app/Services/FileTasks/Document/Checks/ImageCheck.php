<?php

declare(strict_types=1);

namespace App\Services\FileTasks\Document\Checks;

use App\Enums\RubricCheckType;
use App\Services\FileTasks\CheckOutcome;
use App\Services\FileTasks\Document\DocumentModel;
use App\Services\FileTasks\Document\DocumentSelector;
use App\Services\FileTasks\Document\Words;
use App\Services\FileTasks\Grammar\Booleans;
use App\Services\FileTasks\Grammar\Lengths;
use App\Services\FileTasks\Grammar\Numbers;
use App\Services\FileTasks\Grammar\Text;

/**
 * Beágyazott képek dokumentumban: szélesség, magasság, oldalarány, körbefuttatás,
 * alternatív szöveg és darabszám. Szelektor nélkül az első képet nézi.
 */
final class ImageCheck extends AbstractDocumentCheck
{
    /** Az oldalarány ennyi relatív eltéréssel egyezik (a kép méretét a szerkesztő kerekíti). */
    private const RATIO_TOLERANCE = 0.02;

    public function type(): RubricCheckType
    {
        return RubricCheckType::Image;
    }

    protected function properties(): array
    {
        return [
            'width' => ['image'], 'height' => ['image'], 'aspect_ratio' => ['image'], 'wrap' => ['image'],
            'alt_text' => ['image'], 'count' => [],
        ];
    }

    protected function expectedError(string $key, string $expected, ?DocumentSelector $selector): ?string
    {
        return match ($key) {
            'width', 'height' => $this->lengthError($expected),
            'aspect_ratio' => $this->ratio($expected) === null ? $this->message('error.expected_ratio') : null,
            'wrap' => Words::wrap($expected) === null ? $this->message('error.expected_wrap') : null,
            'count' => $this->countError($expected),
            default => $expected === '' ? $this->message('error.expected_text') : null,
        };
    }

    protected function inspect(DocumentModel $document, string $key, ?DocumentSelector $selector, string $expected): CheckOutcome
    {
        if ($key === 'count') {
            $count = count($document->images);

            return new CheckOutcome($count === (int) $expected, $this->found($key, (string) $count));
        }

        $image = $document->images[($selector->index ?? 1) - 1] ?? null;

        if ($image === null) {
            return CheckOutcome::fail();
        }

        switch ($key) {
            case 'width':
            case 'height':
                $foundMm = $key === 'width' ? $image->widthMm : $image->heightMm;
                $wanted = $this->lengthMm($expected);

                return $wanted === null ? CheckOutcome::fail() : new CheckOutcome(Lengths::close($foundMm, $wanted), $this->found($key, Lengths::format($foundMm)));

            case 'aspect_ratio':
                $wanted = $this->ratio($expected);

                if ($wanted === null || $image->heightMm <= 0) {
                    return CheckOutcome::fail();
                }

                $ratio = $image->widthMm / $image->heightMm;

                return new CheckOutcome(
                    abs($ratio - $wanted) <= self::RATIO_TOLERANCE * max($ratio, $wanted),
                    $this->found($key, Numbers::format(round($ratio, 2))),
                );

            case 'wrap':
                return new CheckOutcome(Words::wrap($expected) === $image->wrap, $this->found($key, Words::label('wrap', $image->wrap)));

            default:
                $wantedBool = Booleans::parse($expected);
                $passed = $wantedBool !== null
                    ? ($image->altText !== '') === $wantedBool
                    : Text::matches($image->altText, $expected);

                return new CheckOutcome($passed, $this->found($key, $image->altText === '' ? $this->yesNo(false) : $image->altText));
        }
    }

    /** Oldalarány: szám (1,5) vagy "4:3" alakú; szélesség/magasság. */
    private function ratio(string $text): ?float
    {
        if (preg_match('/^\s*(\d+(?:[.,]\d+)?)\s*[:\/]\s*(\d+(?:[.,]\d+)?)\s*$/', $text, $match) === 1) {
            $height = (float) str_replace(',', '.', $match[2]);

            return $height > 0 ? (float) str_replace(',', '.', $match[1]) / $height : null;
        }

        $number = Numbers::parse($text);

        return $number !== null && $number > 0 ? $number : null;
    }
}
