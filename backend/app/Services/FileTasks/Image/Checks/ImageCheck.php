<?php

declare(strict_types=1);

namespace App\Services\FileTasks\Image\Checks;

use App\Enums\RubricCheckType;
use App\Models\RubricItem;
use App\Services\FileTasks\CheckOutcome;
use App\Services\FileTasks\Grammar\Lengths;
use App\Services\FileTasks\Grammar\Numbers;
use App\Services\FileTasks\Image\PngModel;
use App\Services\FileTasks\OpenedFile;
use App\Services\FileTasks\Presentation\Checks\SelectorCheck;
use App\Services\FileTasks\Presentation\Expected;
use App\Services\FileTasks\Presentation\Message;
use App\Services\FileTasks\Presentation\Selector;

/**
 * `image` vizsgalat png-re: kepponteses szelesseg es magassag (`800`, `800px`),
 * vagy hosszusagban (`10cm`: a pHYs felbontassal, ennek hianyaban 96 dpi-vel),
 * kepmeretarany es darabszam (mindig 1). Szelektor: `[image=1]`.
 */
final class ImageCheck extends SelectorCheck
{
    private const KEYS = ['width', 'height', 'aspect_ratio', 'count'];

    private const DEFAULT_DPI = 96.0;

    public function type(): RubricCheckType
    {
        return RubricCheckType::Image;
    }

    public function supports(OpenedFile $file): bool
    {
        return $file instanceof PngModel;
    }

    public function validate(string $property, string $expected): ?string
    {
        $selector = $this->parseProperty($property, self::KEYS, ['image']);

        if (is_string($selector)) {
            return $selector;
        }

        if ($selector->key === 'count' && $selector->has('image')) {
            return $this->selectorNotAllowed('count');
        }

        return match ($selector->key) {
            'width', 'height' => $this->parseSize($expected, self::DEFAULT_DPI) === null ? Message::get('expected_pixels') : null,
            'aspect_ratio' => Expected::ratioError($expected),
            default => Expected::comparisonError($expected),
        };
    }

    public function evaluate(OpenedFile $file, RubricItem $item): CheckOutcome
    {
        if (! $file instanceof PngModel) {
            return CheckOutcome::fail();
        }

        $selector = Selector::parse($item->property, ['image']);

        if ($selector === null) {
            return CheckOutcome::fail();
        }

        if ($selector->key === 'count') {
            return new CheckOutcome(Expected::holds(1, $item->expected), Message::get('found_image_count', ['count' => 1]));
        }

        if (($selector->get('image') ?? 1) !== 1) {
            return CheckOutcome::fail(Message::get('found_no_image'));
        }

        $found = $file->width.' × '.$file->height.' px';

        if ($selector->key === 'aspect_ratio') {
            $wanted = Expected::parseRatio($item->expected);
            $actual = $file->width / $file->height;

            return new CheckOutcome($wanted !== null && Expected::ratiosClose($actual, $wanted), Numbers::format(round($actual, 2)));
        }

        $wanted = $this->parseSize($item->expected, $file->dpi ?? self::DEFAULT_DPI);
        $actual = $selector->key === 'width' ? $file->width : $file->height;

        return new CheckOutcome($wanted !== null && abs($actual - $wanted) <= 1.0, $found);
    }

    /** Pixelben megadott meret: "800", "800px" vagy hosszusag a felbontassal. */
    private function parseSize(string $expected, float $dpi): ?float
    {
        if (preg_match('/^\s*(\d+(?:[.,]\d+)?)\s*(?:px)?\s*$/i', $expected, $match) === 1) {
            return (float) str_replace(',', '.', $match[1]);
        }

        $millimetres = Lengths::toMillimetres($expected);

        return $millimetres === null ? null : $millimetres / 25.4 * $dpi;
    }
}
