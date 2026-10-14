<?php

declare(strict_types=1);

namespace App\Services\FileTasks\Presentation;

use App\Services\FileTasks\CheckOutcome;
use App\Services\FileTasks\Grammar\Colors;
use App\Services\FileTasks\Grammar\Text;

/**
 * Az alakzat-tulajdonsagok (count, type, fill, transparency, text) kozos
 * kiertekeloje a bemutato (pptx, odp) es a vektorgrafika (svg) szamara.
 * A hivo donti el, melyik alakzatok esnek a szelektor hatokorebe.
 */
final class ShapeMatcher
{
    public const KEYS = ['count', 'type', 'fill', 'transparency', 'text'];

    public static function expectedError(string $key, string $expected): ?string
    {
        return match ($key) {
            'count' => Expected::comparisonError($expected),
            'type' => Vocabulary::normaliseKind($expected) === null ? Message::get('expected_kind') : null,
            'fill' => Expected::colorError($expected, true),
            'transparency' => Expected::percentError($expected),
            'text' => Expected::textError($expected),
            default => null,
        };
    }

    /**
     * A tulajdonsag kiertekelese: `count` a hatokor alakzatainak szamat veti
     * ossze, a tobbi azt nezi, van-e a hatokorben a feltetelnek megfelelo alakzat.
     *
     * @param  list<ShapeModel>  $scope
     */
    public static function evaluate(string $key, string $expected, array $scope): CheckOutcome
    {
        if ($key === 'count') {
            return new CheckOutcome(Expected::holds(count($scope), $expected), Message::get('found_shape_count', ['count' => count($scope)]));
        }

        if ($scope === []) {
            return CheckOutcome::fail(Message::get('found_no_shape'));
        }

        $firstFound = null;

        foreach ($scope as $shape) {
            $result = self::single($key, $expected, $shape);

            if ($result === null) {
                continue;
            }

            if ($result['passed']) {
                return CheckOutcome::pass($result['found']);
            }

            $firstFound ??= $result['found'];
        }

        return CheckOutcome::fail($firstFound);
    }

    /** @return array{passed: bool, found: string}|null null, ha az alakzatban nincs ilyen adat */
    private static function single(string $key, string $expected, ShapeModel $shape): ?array
    {
        switch ($key) {
            case 'type':
                return ['passed' => $shape->kind === Vocabulary::normaliseKind($expected), 'found' => Vocabulary::kindLabel($shape->kind)];

            case 'fill':
                if ($shape->fill === null) {
                    return null;
                }

                if (Expected::isNone($expected)) {
                    return ['passed' => $shape->fill === 'none', 'found' => self::fillLabel($shape->fill)];
                }

                $wanted = Colors::parse($expected);

                return [
                    'passed' => $wanted !== null && preg_match('/^[0-9A-F]{6}$/', $shape->fill) === 1 && Colors::close($shape->fill, $wanted),
                    'found' => self::fillLabel($shape->fill),
                ];

            case 'transparency':
                $actual = $shape->transparency ?? (preg_match('/^[0-9A-F]{6}$/', (string) $shape->fill) === 1 ? 0.0 : null);
                $wanted = Expected::parsePercent($expected);

                if ($actual === null) {
                    return null;
                }

                return [
                    'passed' => $wanted !== null && abs($actual - $wanted) <= Expected::PERCENT_TOLERANCE,
                    'found' => rtrim(rtrim(number_format($actual, 1, ',', ''), '0'), ',').'%',
                ];

            default:
                if (trim($shape->text) === '') {
                    return null;
                }

                return [
                    'passed' => Text::matches(preg_replace('/\s+/u', ' ', $shape->text) ?? $shape->text, preg_replace('/\s+/u', ' ', $expected) ?? $expected),
                    'found' => Expected::excerpt($shape->text),
                ];
        }
    }

    private static function fillLabel(string $fill): string
    {
        return match (true) {
            preg_match('/^[0-9A-F]{6}$/', $fill) === 1 => Colors::format($fill),
            $fill === 'none' => Message::get('fill_none'),
            $fill === 'gradient' => Message::get('background_gradient'),
            $fill === 'image' => Message::get('background_image'),
            default => Message::get('background_pattern'),
        };
    }
}
