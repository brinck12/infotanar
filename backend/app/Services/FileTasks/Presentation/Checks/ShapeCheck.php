<?php

declare(strict_types=1);

namespace App\Services\FileTasks\Presentation\Checks;

use App\Enums\RubricCheckType;
use App\Models\RubricItem;
use App\Services\FileTasks\CheckOutcome;
use App\Services\FileTasks\OpenedFile;
use App\Services\FileTasks\Presentation\Message;
use App\Services\FileTasks\Presentation\PresentationModel;
use App\Services\FileTasks\Presentation\Selector;
use App\Services\FileTasks\Presentation\ShapeMatcher;
use App\Services\FileTasks\Presentation\ShapeModel;

/**
 * `shape` vizsgalat bemutatora (pptx, odp): alakzatok szama, fajtaja,
 * kitoltese, atlatszosaga, szovege. Hatokor: az egesz bemutato, egy dia
 * (`[slide=N]`) vagy egy alakzat (`[slide=N,shape=M]`). A `count` a hatokor
 * alakzatait szamolja, a tobbi tulajdonsag akkor teljesul, ha a hatokor
 * valamelyik alakzata megfelel.
 */
final class ShapeCheck extends SelectorCheck
{
    public function type(): RubricCheckType
    {
        return RubricCheckType::Shape;
    }

    public function supports(OpenedFile $file): bool
    {
        return $file instanceof PresentationModel;
    }

    public function validate(string $property, string $expected): ?string
    {
        $selector = $this->parseProperty($property, ShapeMatcher::KEYS, ['slide', 'shape']);

        if (is_string($selector)) {
            return $selector;
        }

        if ($selector->has('shape') && ! $selector->has('slide')) {
            return Message::get('shape_needs_slide');
        }

        if ($selector->key === 'count' && $selector->has('shape')) {
            return $this->selectorNotAllowed('count');
        }

        return ShapeMatcher::expectedError($selector->key, $expected);
    }

    public function evaluate(OpenedFile $file, RubricItem $item): CheckOutcome
    {
        if (! $file instanceof PresentationModel) {
            return CheckOutcome::fail();
        }

        $selector = Selector::parse($item->property, ['slide', 'shape']);

        if ($selector === null) {
            return CheckOutcome::fail();
        }

        $slideNumber = $selector->get('slide');
        $shapeNumber = $selector->get('shape');

        if ($slideNumber !== null && $file->slide($slideNumber) === null) {
            return CheckOutcome::fail(Message::get('found_no_slide', ['slide' => $slideNumber]));
        }

        return ShapeMatcher::evaluate($selector->key, $item->expected, $this->scope($file, $slideNumber, $shapeNumber));
    }

    /** @return list<ShapeModel> */
    private function scope(PresentationModel $file, ?int $slideNumber, ?int $shapeNumber): array
    {
        $slides = $slideNumber === null ? $file->slides : array_filter([$file->slide($slideNumber)]);
        $shapes = [];

        foreach ($slides as $slide) {
            array_push($shapes, ...$slide->shapes);
        }

        if ($shapeNumber === null) {
            return $shapes;
        }

        return array_filter([$shapes[$shapeNumber - 1] ?? null]);
    }
}
