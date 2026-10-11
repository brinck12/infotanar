<?php

declare(strict_types=1);

namespace App\Services\FileTasks\Web\Checks;

use App\Enums\RubricCheckType;
use App\Models\RubricItem;
use App\Services\FileTasks\CheckHandler;
use App\Services\FileTasks\CheckOutcome;
use App\Services\FileTasks\Grammar\Booleans;
use App\Services\FileTasks\Grammar\Colors;
use App\Services\FileTasks\Grammar\Numbers;
use App\Services\FileTasks\Grammar\PropertyKey;
use App\Services\FileTasks\Grammar\Text;
use App\Services\FileTasks\OpenedFile;
use App\Services\FileTasks\Presentation\Expected;
use App\Services\FileTasks\Presentation\Message;
use App\Services\FileTasks\Web\CssColors;
use App\Services\FileTasks\Web\CssParser;
use App\Services\FileTasks\Web\WebModel;

/**
 * `web` vizsgalat (html, css): cim, elemek szama, CSS-deklaracio, osztaly
 * hasznalata, hivatkozas, kepmeret. A szelektorok az egyszeru alakokra
 * korlatozodnak: `tag`, `.osztaly`, `#id`, `tag.osztaly`.
 *
 * A `css[szelektor.tulajdonsag]` kulcsban a szelektort es a tulajdonsagot az
 * UTOLSO pont valasztja el (`p.intro.color` = `p.intro` + `color`).
 */
final class WebCheck implements CheckHandler
{
    private const KEYS = ['title', 'element_count', 'css', 'class_used', 'link', 'img_size'];

    private const ABSOLUTE_PIXELS = ['px' => 1.0, 'pt' => 96 / 72, 'cm' => 96 / 2.54, 'mm' => 96 / 25.4, 'in' => 96.0];

    public function type(): RubricCheckType
    {
        return RubricCheckType::Web;
    }

    public function supports(OpenedFile $file): bool
    {
        return $file instanceof WebModel;
    }

    public function validate(string $property, string $expected): ?string
    {
        $key = PropertyKey::parse($property);

        if ($key === null || ! in_array($key->key, self::KEYS, true)) {
            return Message::get('invalid_property', ['property' => trim($property), 'allowed' => implode(', ', self::KEYS)]);
        }

        $selector = $key->selector;

        if ($key->key === 'title') {
            return $selector !== null ? Message::get('selector_not_allowed', ['property' => 'title']) : Expected::textError($expected);
        }

        if ($selector === null || $selector === '') {
            return Message::get('web_needs_selector', ['property' => $key->key]);
        }

        return match ($key->key) {
            'element_count' => WebModel::xpathFor($selector) === null
                ? Message::get('web_bad_selector', ['selector' => $selector])
                : Expected::comparisonError($expected),
            'css' => $this->cssError($selector, $expected),
            'class_used' => preg_match('/^\.?[A-Za-z_][\w-]*$/', $selector) !== 1
                ? Message::get('web_bad_class', ['class' => $selector])
                : Expected::booleanError($expected),
            'link' => Booleans::parse($expected) !== null || Expected::textError($expected) === null
                ? null
                : Message::get('expected_link'),
            default => $this->imgSizeError($selector, $expected),
        };
    }

    public function evaluate(OpenedFile $file, RubricItem $item): CheckOutcome
    {
        if (! $file instanceof WebModel) {
            return CheckOutcome::fail();
        }

        $key = PropertyKey::parse($item->property);

        if ($key === null) {
            return CheckOutcome::fail();
        }

        $selector = $key->selector ?? '';
        $expected = $item->expected;

        if ($key->key === 'css') {
            return $this->css($file, $selector, $expected);
        }

        if (! $file->isHtml()) {
            return CheckOutcome::fail(Message::get('found_not_html'));
        }

        return match ($key->key) {
            'title' => $this->title($file, $expected),
            'element_count' => $this->elementCount($file, $selector, $expected),
            'class_used' => $this->classUsed($file, $selector, $expected),
            'link' => $this->link($file, $selector, $expected),
            'img_size' => $this->imgSize($file, $selector, $expected),
            default => CheckOutcome::fail(),
        };
    }

    private function title(WebModel $file, string $expected): CheckOutcome
    {
        $title = $file->title();

        if ($title === null || $title === '') {
            return CheckOutcome::fail(Message::get('found_no_title'));
        }

        return new CheckOutcome(Text::matches($title, $expected), Expected::excerpt($title, 80));
    }

    private function elementCount(WebModel $file, string $selector, string $expected): CheckOutcome
    {
        $count = count($file->elements($selector));

        return new CheckOutcome(Expected::holds($count, $expected), Message::get('found_element_count', ['count' => $count]));
    }

    private function classUsed(WebModel $file, string $selector, string $expected): CheckOutcome
    {
        $used = $file->classUsed(ltrim($selector, '.'));
        $wanted = Booleans::parse($expected);

        return new CheckOutcome($wanted === $used, $used ? Message::get('found_class_used') : Message::get('found_class_unused'));
    }

    private function link(WebModel $file, string $href, string $expected): CheckOutcome
    {
        $wanted = rtrim(strtolower(trim($href)), '/');
        $text = null;

        foreach ($file->links() as $anchor) {
            if (rtrim(strtolower(trim($anchor->getAttribute('href'))), '/') === $wanted) {
                $text = trim((string) preg_replace('/\s+/u', ' ', $anchor->textContent));

                break;
            }
        }

        $flag = Booleans::parse($expected);

        if ($flag !== null) {
            return new CheckOutcome(($text !== null) === $flag, $text !== null ? Message::get('found_link') : Message::get('found_no_link'));
        }

        if ($text === null) {
            return CheckOutcome::fail(Message::get('found_no_link'));
        }

        return new CheckOutcome(Text::matches($text, $expected), Expected::excerpt($text));
    }

    private function imgSize(WebModel $file, string $index, string $expected): CheckOutcome
    {
        $image = $file->images()[(int) $index - 1] ?? null;

        if ($image === null) {
            return CheckOutcome::fail(Message::get('found_no_image'));
        }

        $width = $this->pixels($image->getAttribute('width')) ?? $this->pixels($this->inline($image->getAttribute('style'), 'width'));
        $height = $this->pixels($image->getAttribute('height')) ?? $this->pixels($this->inline($image->getAttribute('style'), 'height'));

        if ($width === null || $height === null) {
            return CheckOutcome::fail(Message::get('found_no_img_size'));
        }

        $wanted = $this->parseSize($expected);

        return new CheckOutcome(
            $wanted !== null && abs($wanted[0] - $width) <= 1.0 && abs($wanted[1] - $height) <= 1.0,
            Numbers::format($width).' × '.Numbers::format($height).' px',
        );
    }

    private function css(WebModel $file, string $key, string $expected): CheckOutcome
    {
        $split = $this->splitCssKey($key);

        if ($split === null) {
            return CheckOutcome::fail();
        }

        [$selector, $property] = $split;
        $actual = $file->cssValue($selector, $property);

        if ($actual === null) {
            return CheckOutcome::fail(Message::get('found_no_css_value'));
        }

        return new CheckOutcome($this->cssValuesMatch($property, $actual, $expected), Expected::excerpt($actual, 80));
    }

    private function cssValuesMatch(string $property, string $actual, string $expected): bool
    {
        if (str_starts_with($expected, '~')) {
            return Text::contains($actual, substr($expected, 1));
        }

        if (str_contains($property, 'color') || in_array($property, ['background', 'fill', 'stroke'], true)) {
            $wantedColor = Colors::parse($expected) ?? CssColors::parse($expected);
            $actualColor = CssColors::parse($actual);

            if ($wantedColor !== null && $actualColor !== null) {
                return Colors::close($actualColor, $wantedColor);
            }
        }

        $wantedLength = $this->parseCssLength($expected);
        $actualLength = $this->parseCssLength($actual);

        if ($wantedLength !== null && $actualLength !== null) {
            return $this->lengthsMatch($actualLength, $wantedLength);
        }

        return $this->normaliseValue($actual) === $this->normaliseValue($expected);
    }

    /**
     * @param  array{0: float, 1: string}  $actual
     * @param  array{0: float, 1: string}  $wanted
     */
    private function lengthsMatch(array $actual, array $wanted): bool
    {
        if ($actual[1] === $wanted[1]) {
            return abs($actual[0] - $wanted[0]) <= 1e-4;
        }

        if ($actual[0] === 0.0 && $wanted[0] === 0.0) {
            return true;
        }

        if (isset(self::ABSOLUTE_PIXELS[$actual[1]], self::ABSOLUTE_PIXELS[$wanted[1]])) {
            return abs($actual[0] * self::ABSOLUTE_PIXELS[$actual[1]] - $wanted[0] * self::ABSOLUTE_PIXELS[$wanted[1]]) <= 0.5;
        }

        return false;
    }

    /** @return array{0: float, 1: string}|null szam, mertekegyseg ("" = egyseg nelkuli) */
    private function parseCssLength(string $value): ?array
    {
        if (preg_match('/^\s*(-?\d*\.?\d+)\s*(px|pt|cm|mm|in|em|rem|%|vw|vh)?\s*$/i', str_replace(',', '.', $value), $match) !== 1) {
            return null;
        }

        $unit = strtolower($match[2] ?? '');

        return [(float) $match[1], $unit === '' ? 'px' : $unit];
    }

    private function normaliseValue(string $value): string
    {
        $value = str_replace(['"', "'"], '', $value);
        $value = (string) preg_replace('/\s*,\s*/', ',', $value);

        return Text::fold($value);
    }

    /** @return array{0: string, 1: string}|null szelektor, tulajdonsag */
    private function splitCssKey(string $key): ?array
    {
        $dot = strrpos($key, '.');

        if ($dot === false) {
            return null;
        }

        $selector = substr($key, 0, $dot);
        $property = strtolower(substr($key, $dot + 1));

        if ($selector === '' || WebModel::xpathFor($selector) === null || preg_match('/^-{0,2}[a-z][a-z0-9-]*$/', $property) !== 1) {
            return null;
        }

        return [CssParser::normaliseSelector($selector), $property];
    }

    private function cssError(string $key, string $expected): ?string
    {
        if ($this->splitCssKey($key) === null) {
            return Message::get('web_bad_css_key', ['key' => $key]);
        }

        return trim($expected) === '' ? Message::get('expected_text') : null;
    }

    private function imgSizeError(string $index, string $expected): ?string
    {
        if (preg_match('/^[1-9]\d{0,3}$/', $index) !== 1) {
            return Message::get('web_bad_index', ['index' => $index]);
        }

        return $this->parseSize($expected) === null ? Message::get('expected_img_size') : null;
    }

    /** @return array{0: float, 1: float}|null szelesseg, magassag pixelben */
    private function parseSize(string $expected): ?array
    {
        if (preg_match('/^\s*(\d+(?:[.,]\d+)?)\s*(?:px)?\s*[x×]\s*(\d+(?:[.,]\d+)?)\s*(?:px)?\s*$/u', $expected, $match) !== 1) {
            return null;
        }

        return [(float) str_replace(',', '.', $match[1]), (float) str_replace(',', '.', $match[2])];
    }

    private function pixels(string $value): ?float
    {
        return preg_match('/^\s*(\d+(?:\.\d+)?)\s*(?:px)?\s*$/i', $value, $match) === 1 ? (float) $match[1] : null;
    }

    private function inline(string $style, string $property): string
    {
        foreach (explode(';', $style) as $part) {
            $colon = strpos($part, ':');

            if ($colon !== false && strtolower(trim(substr($part, 0, $colon))) === $property) {
                return trim(substr($part, $colon + 1));
            }
        }

        return '';
    }
}
