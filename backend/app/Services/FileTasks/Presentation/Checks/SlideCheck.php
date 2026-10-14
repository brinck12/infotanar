<?php

declare(strict_types=1);

namespace App\Services\FileTasks\Presentation\Checks;

use App\Enums\RubricCheckType;
use App\Models\RubricItem;
use App\Services\FileTasks\CheckOutcome;
use App\Services\FileTasks\Grammar\Booleans;
use App\Services\FileTasks\Grammar\Colors;
use App\Services\FileTasks\Grammar\Lengths;
use App\Services\FileTasks\Grammar\Text;
use App\Services\FileTasks\OpenedFile;
use App\Services\FileTasks\Presentation\Expected;
use App\Services\FileTasks\Presentation\Message;
use App\Services\FileTasks\Presentation\PresentationModel;
use App\Services\FileTasks\Presentation\Selector;
use App\Services\FileTasks\Presentation\SlideModel;
use App\Services\FileTasks\Presentation\Vocabulary;

/**
 * `slide` vizsgalat (pptx, odp): diak szama, merete, hatter, minta betutipusa,
 * cimmeret, valtas, ismetles. A diankenti tulajdonsagok (hatter, hatter-
 * tipus, cimmeret, valtas) szelektor nelkul MINDEN diara ervenyesek.
 */
final class SlideCheck extends SelectorCheck
{
    private const KEYS = ['count', 'width', 'height', 'background', 'background_type', 'master_font', 'title_size', 'transition', 'loop'];

    private const PER_SLIDE = ['background', 'background_type', 'title_size', 'transition'];

    private const BACKGROUND_TYPES = [
        'solid' => 'solid', 'egyszinu' => 'solid', 'tomor' => 'solid',
        'gradient' => 'gradient', 'szinatmenet' => 'gradient', 'szinatmenetes' => 'gradient',
        'image' => 'image', 'kep' => 'image', 'bitmap' => 'image',
        'pattern' => 'pattern', 'minta' => 'pattern',
        'none' => 'none', 'nincs' => 'none',
    ];

    public function type(): RubricCheckType
    {
        return RubricCheckType::Slide;
    }

    public function supports(OpenedFile $file): bool
    {
        return $file instanceof PresentationModel;
    }

    public function validate(string $property, string $expected): ?string
    {
        $selector = $this->parseProperty($property, self::KEYS, ['slide']);

        if (is_string($selector)) {
            return $selector;
        }

        if ($selector->has('slide') && ! in_array($selector->key, self::PER_SLIDE, true)) {
            return $this->selectorNotAllowed($selector->key);
        }

        return match ($selector->key) {
            'count' => Expected::comparisonError($expected),
            'width', 'height' => Expected::lengthError($expected),
            'background' => Expected::colorError($expected),
            'background_type' => $this->backgroundType($expected) === null ? Message::get('expected_background_type') : null,
            'master_font' => Expected::textError($expected),
            'title_size' => Expected::pointsError($expected),
            'transition' => Vocabulary::normaliseTransition($expected) === null ? Message::get('expected_transition') : null,
            'loop' => Expected::booleanError($expected),
            default => null,
        };
    }

    public function evaluate(OpenedFile $file, RubricItem $item): CheckOutcome
    {
        if (! $file instanceof PresentationModel) {
            return CheckOutcome::fail();
        }

        $selector = Selector::parse($item->property, ['slide']);

        if ($selector === null) {
            return CheckOutcome::fail();
        }

        $expected = $item->expected;

        return match ($selector->key) {
            'count' => new CheckOutcome(Expected::holds(count($file->slides), $expected), Message::get('found_slide_count', ['count' => count($file->slides)])),
            'width' => $this->size($file->widthMm, $expected),
            'height' => $this->size($file->heightMm, $expected),
            'master_font' => $this->masterFont($file, $expected),
            'loop' => $this->loop($file, $expected),
            default => $this->perSlide($file, $selector, $expected),
        };
    }

    private function size(float $actual, string $expected): CheckOutcome
    {
        $wanted = Lengths::toMillimetres($expected);

        return new CheckOutcome($wanted !== null && Lengths::close($actual, $wanted), Lengths::format($actual));
    }

    private function masterFont(PresentationModel $file, string $expected): CheckOutcome
    {
        if ($file->titleFont === null && $file->bodyFont === null) {
            return CheckOutcome::fail();
        }

        $passed = ($file->titleFont !== null && Text::matches($file->titleFont, $expected))
            || ($file->bodyFont !== null && Text::matches($file->bodyFont, $expected));

        return new CheckOutcome($passed, Message::get('found_master_font', [
            'title' => $file->titleFont ?? '–',
            'body' => $file->bodyFont ?? '–',
        ]));
    }

    private function loop(PresentationModel $file, string $expected): CheckOutcome
    {
        $wanted = Booleans::parse($expected);

        return new CheckOutcome($wanted === $file->loop, Message::get('found_loop', ['value' => Booleans::format($file->loop)]));
    }

    private function perSlide(PresentationModel $file, Selector $selector, string $expected): CheckOutcome
    {
        $number = $selector->get('slide');
        $slides = $number === null ? $file->slides : array_filter([$file->slide($number)]);

        if ($slides === []) {
            return CheckOutcome::fail($number === null ? null : Message::get('found_no_slide', ['slide' => $number]));
        }

        $first = null;

        foreach ($slides as $slide) {
            $result = $this->slideValue($selector->key, $slide, $expected);

            if ($result === null) {
                continue;
            }

            if (! $result['passed']) {
                return CheckOutcome::fail(count($slides) === 1 ? $result['found'] : Message::get('found_on_slide', ['slide' => $slide->number, 'value' => $result['found']]));
            }

            $first ??= $result['found'];
        }

        if ($first === null) {
            return CheckOutcome::fail();
        }

        return CheckOutcome::pass(count($slides) === 1 ? $first : Message::get('found_on_all_slides', ['value' => $first, 'count' => count($slides)]));
    }

    /** @return array{passed: bool, found: string}|null null, ha a dian nincs mit vizsgalni */
    private function slideValue(string $key, SlideModel $slide, string $expected): ?array
    {
        switch ($key) {
            case 'background':
                $wanted = Colors::parse($expected);

                if ($slide->backgroundType !== 'solid' || $slide->backgroundColor === null) {
                    return ['passed' => false, 'found' => $this->backgroundTypeLabel($slide->backgroundType)];
                }

                return [
                    'passed' => $wanted !== null && Colors::close($slide->backgroundColor, $wanted),
                    'found' => Colors::format($slide->backgroundColor),
                ];

            case 'background_type':
                return [
                    'passed' => $slide->backgroundType === $this->backgroundType($expected),
                    'found' => $this->backgroundTypeLabel($slide->backgroundType),
                ];

            case 'title_size':
                if (! $slide->hasTitle) {
                    return null;
                }

                $wanted = Expected::parsePoints($expected);

                if ($slide->titleSizePt === null) {
                    return ['passed' => false, 'found' => Message::get('found_no_title_size')];
                }

                return [
                    'passed' => $wanted !== null && abs($slide->titleSizePt - $wanted) <= Expected::POINT_TOLERANCE,
                    'found' => rtrim(rtrim(number_format($slide->titleSizePt, 1, ',', ''), '0'), ',').' pt',
                ];

            default:
                $wanted = Vocabulary::normaliseTransition($expected);

                return [
                    'passed' => $wanted !== null && $slide->transition === $wanted,
                    'found' => Vocabulary::transitionLabel($slide->transition),
                ];
        }
    }

    private function backgroundType(string $text): ?string
    {
        return self::BACKGROUND_TYPES[Text::fold($text)] ?? null;
    }

    private function backgroundTypeLabel(string $type): string
    {
        return match ($type) {
            'solid' => Message::get('background_solid'),
            'gradient' => Message::get('background_gradient'),
            'image' => Message::get('background_image'),
            'pattern' => Message::get('background_pattern'),
            default => Message::get('background_none'),
        };
    }
}
