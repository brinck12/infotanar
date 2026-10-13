<?php

declare(strict_types=1);

namespace App\Services\FileTasks\Vector\Checks;

use App\Enums\RubricCheckType;
use App\Models\RubricItem;
use App\Services\FileTasks\CheckOutcome;
use App\Services\FileTasks\OpenedFile;
use App\Services\FileTasks\Presentation\Checks\SelectorCheck;
use App\Services\FileTasks\Presentation\ImageMatcher;
use App\Services\FileTasks\Presentation\Selector;
use App\Services\FileTasks\Vector\SvgModel;

/**
 * `image` vizsgalat svg-re: a beagyazott `<image>` elemek szama, merete,
 * aranya es helyettesito szovege (`<title>`, `<desc>` vagy aria-label).
 * Szelektor: `[image=N]`. A szazalekban vagy meg nem adott meretu kep
 * merete nem ismert, az ilyen pont nem teljesul.
 */
final class ImageCheck extends SelectorCheck
{
    public function type(): RubricCheckType
    {
        return RubricCheckType::Image;
    }

    public function supports(OpenedFile $file): bool
    {
        return $file instanceof SvgModel;
    }

    public function validate(string $property, string $expected): ?string
    {
        $selector = $this->parseProperty($property, ImageMatcher::KEYS, ['image']);

        if (is_string($selector)) {
            return $selector;
        }

        if ($selector->key === 'count' && $selector->has('image')) {
            return $this->selectorNotAllowed('count');
        }

        return ImageMatcher::expectedError($selector->key, $expected);
    }

    public function evaluate(OpenedFile $file, RubricItem $item): CheckOutcome
    {
        if (! $file instanceof SvgModel) {
            return CheckOutcome::fail();
        }

        $selector = Selector::parse($item->property, ['image']);

        if ($selector === null) {
            return CheckOutcome::fail();
        }

        $number = $selector->get('image');
        $scope = $number === null ? $file->images : array_filter([$file->images[$number - 1] ?? null]);

        return ImageMatcher::evaluate($selector->key, $item->expected, $scope);
    }
}
