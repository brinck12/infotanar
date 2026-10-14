<?php

declare(strict_types=1);

namespace App\Services\FileTasks\Presentation;

use App\Services\FileTasks\CheckOutcome;
use App\Services\FileTasks\Grammar\Booleans;
use App\Services\FileTasks\Grammar\Lengths;
use App\Services\FileTasks\Grammar\Numbers;
use App\Services\FileTasks\Grammar\Text;

/**
 * A kep-tulajdonsagok (width, height, aspect_ratio, alt_text, count) kozos
 * kiertekeloje a bemutato (pptx, odp) es a vektorgrafika (svg) szamara.
 *
 * A `count` a hatokor kepeinek szamat veti ossze. A tobbi tulajdonsagnal a
 * hatokor MINDEN kepenek meg kell felelnie (pl. "minden kepnek van alt
 * szovege"); legalabb egy kep kell.
 */
final class ImageMatcher
{
    public const KEYS = ['width', 'height', 'aspect_ratio', 'alt_text', 'count'];

    public static function expectedError(string $key, string $expected): ?string
    {
        return match ($key) {
            'width', 'height' => Expected::lengthError($expected),
            'aspect_ratio' => Expected::ratioError($expected),
            'alt_text' => Booleans::parse($expected) !== null || Expected::textError($expected) === null ? null : Message::get('expected_text'),
            'count' => Expected::comparisonError($expected),
            default => null,
        };
    }

    /**
     * @param  list<ImageModel>  $scope
     */
    public static function evaluate(string $key, string $expected, array $scope): CheckOutcome
    {
        if ($key === 'count') {
            return new CheckOutcome(Expected::holds(count($scope), $expected), Message::get('found_image_count', ['count' => count($scope)]));
        }

        if ($scope === []) {
            return CheckOutcome::fail(Message::get('found_no_image'));
        }

        $first = null;

        foreach ($scope as $image) {
            $result = self::single($key, $expected, $image);

            if ($result === null) {
                return CheckOutcome::fail(Message::get('found_image_size_unknown'));
            }

            if (! $result['passed']) {
                return CheckOutcome::fail($result['found']);
            }

            $first ??= $result['found'];
        }

        return CheckOutcome::pass(count($scope) === 1 ? $first : Message::get('found_on_all_images', ['value' => $first, 'count' => count($scope)]));
    }

    /** @return array{passed: bool, found: string}|null null, ha a kep merete nem ismert */
    private static function single(string $key, string $expected, ImageModel $image): ?array
    {
        switch ($key) {
            case 'width':
            case 'height':
                $actual = $key === 'width' ? $image->widthMm : $image->heightMm;
                $wanted = Lengths::toMillimetres($expected);

                if ($actual === null) {
                    return null;
                }

                return ['passed' => $wanted !== null && Lengths::close($actual, $wanted), 'found' => Lengths::format($actual)];

            case 'aspect_ratio':
                $actual = $image->aspectRatio();
                $wanted = Expected::parseRatio($expected);

                if ($actual === null) {
                    return null;
                }

                return ['passed' => $wanted !== null && Expected::ratiosClose($actual, $wanted), 'found' => Numbers::format(round($actual, 2))];

            default:
                $alt = $image->altText;
                $flag = Booleans::parse($expected);

                if ($flag !== null) {
                    return ['passed' => ($alt !== null) === $flag, 'found' => $alt === null ? Message::get('found_no_alt') : Expected::excerpt($alt)];
                }

                return ['passed' => $alt !== null && Text::matches($alt, $expected), 'found' => $alt === null ? Message::get('found_no_alt') : Expected::excerpt($alt)];
        }
    }
}
