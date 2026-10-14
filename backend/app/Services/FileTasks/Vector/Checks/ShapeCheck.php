<?php

declare(strict_types=1);

namespace App\Services\FileTasks\Vector\Checks;

use App\Enums\RubricCheckType;
use App\Models\RubricItem;
use App\Services\FileTasks\CheckOutcome;
use App\Services\FileTasks\OpenedFile;
use App\Services\FileTasks\Presentation\Checks\SelectorCheck;
use App\Services\FileTasks\Presentation\Selector;
use App\Services\FileTasks\Presentation\ShapeMatcher;
use App\Services\FileTasks\Vector\SvgModel;

/**
 * `shape` vizsgalat svg-re: az alakzatok (rect, circle, ellipse, line,
 * polyline, polygon, path, text) szama, fajtaja, kitoltese, atlatszosaga es
 * szovege. Szelektor: `[shape=N]` (az N. alakzat dokumentum-sorrendben);
 * nelkule a `count` az osszeset szamolja, a tobbi tulajdonsag akkor teljesul,
 * ha valamelyik alakzat megfelel.
 */
final class ShapeCheck extends SelectorCheck
{
    public function type(): RubricCheckType
    {
        return RubricCheckType::Shape;
    }

    public function supports(OpenedFile $file): bool
    {
        return $file instanceof SvgModel;
    }

    public function validate(string $property, string $expected): ?string
    {
        $selector = $this->parseProperty($property, ShapeMatcher::KEYS, ['shape']);

        if (is_string($selector)) {
            return $selector;
        }

        if ($selector->key === 'count' && $selector->has('shape')) {
            return $this->selectorNotAllowed('count');
        }

        return ShapeMatcher::expectedError($selector->key, $expected);
    }

    public function evaluate(OpenedFile $file, RubricItem $item): CheckOutcome
    {
        if (! $file instanceof SvgModel) {
            return CheckOutcome::fail();
        }

        $selector = Selector::parse($item->property, ['shape']);

        if ($selector === null) {
            return CheckOutcome::fail();
        }

        $number = $selector->get('shape');
        $scope = $number === null ? $file->shapes : array_filter([$file->shapes[$number - 1] ?? null]);

        return ShapeMatcher::evaluate($selector->key, $item->expected, $scope);
    }
}
