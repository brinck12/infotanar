<?php

declare(strict_types=1);

namespace App\Services\FileTasks\Presentation\Checks;

use App\Enums\RubricCheckType;
use App\Models\RubricItem;
use App\Services\FileTasks\CheckOutcome;
use App\Services\FileTasks\OpenedFile;
use App\Services\FileTasks\Presentation\ImageMatcher;
use App\Services\FileTasks\Presentation\ImageModel;
use App\Services\FileTasks\Presentation\Message;
use App\Services\FileTasks\Presentation\PresentationModel;
use App\Services\FileTasks\Presentation\Selector;

/**
 * `image` vizsgalat bemutatora (pptx, odp): a kepek szama, merete, aranya es
 * helyettesito szovege. Szelektor: `[image=N]` (a bemutato N. kepe),
 * `[slide=S]` (a dia kepei), `[slide=S,image=M]` (a dia M. kepe). A `wrap`
 * (szovegkorbefolyas) bemutatoban nincs, azt a dokumentum-vizsgalat kezeli.
 */
final class ImageCheck extends SelectorCheck
{
    public function type(): RubricCheckType
    {
        return RubricCheckType::Image;
    }

    public function supports(OpenedFile $file): bool
    {
        return $file instanceof PresentationModel;
    }

    public function validate(string $property, string $expected): ?string
    {
        $selector = $this->parseProperty($property, ImageMatcher::KEYS, ['slide', 'image']);

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
        if (! $file instanceof PresentationModel) {
            return CheckOutcome::fail();
        }

        $selector = Selector::parse($item->property, ['slide', 'image']);

        if ($selector === null) {
            return CheckOutcome::fail();
        }

        $slideNumber = $selector->get('slide');

        if ($slideNumber !== null && $file->slide($slideNumber) === null) {
            return CheckOutcome::fail(Message::get('found_no_slide', ['slide' => $slideNumber]));
        }

        return ImageMatcher::evaluate($selector->key, $item->expected, $this->scope($file, $slideNumber, $selector->get('image')));
    }

    /** @return list<ImageModel> */
    private function scope(PresentationModel $file, ?int $slideNumber, ?int $imageNumber): array
    {
        $images = $slideNumber === null ? $file->images() : $this->slideImages($file, $slideNumber);

        return $imageNumber === null ? $images : array_filter([$images[$imageNumber - 1] ?? null]);
    }

    /** @return list<ImageModel> */
    private function slideImages(PresentationModel $file, int $slideNumber): array
    {
        $images = [];

        foreach ($file->slide($slideNumber)->shapes ?? [] as $shape) {
            if ($shape->image !== null) {
                $images[] = $shape->image;
            }
        }

        return $images;
    }
}
