<?php

declare(strict_types=1);

namespace App\Services\FileTasks\Presentation\Checks;

use App\Enums\RubricCheckType;
use App\Models\RubricItem;
use App\Services\FileTasks\CheckOutcome;
use App\Services\FileTasks\OpenedFile;
use App\Services\FileTasks\Presentation\AnimationModel;
use App\Services\FileTasks\Presentation\Expected;
use App\Services\FileTasks\Presentation\Message;
use App\Services\FileTasks\Presentation\PresentationModel;
use App\Services\FileTasks\Presentation\Selector;
use App\Services\FileTasks\Presentation\Vocabulary;

/**
 * `animation` vizsgalat (pptx, odp): effektus, idotartam, kesleltetes, inditas.
 * A hatokor az egesz bemutato (szelektor nelkul), egy dia (`[slide=N]`) vagy
 * egy alakzat (`[slide=N,shape=M]`); a pont teljesul, ha a hatokor valamelyik
 * animacioja megfelel. Ha nincs animacio a hatokorben, a pont nem teljesul.
 */
final class AnimationCheck extends SelectorCheck
{
    private const KEYS = ['effect', 'duration', 'delay', 'trigger'];

    public function type(): RubricCheckType
    {
        return RubricCheckType::Animation;
    }

    public function supports(OpenedFile $file): bool
    {
        return $file instanceof PresentationModel;
    }

    public function validate(string $property, string $expected): ?string
    {
        $selector = $this->parseProperty($property, self::KEYS, ['slide', 'shape']);

        if (is_string($selector)) {
            return $selector;
        }

        if ($selector->has('shape') && ! $selector->has('slide')) {
            return Message::get('shape_needs_slide');
        }

        return match ($selector->key) {
            'effect' => Vocabulary::normaliseEffect($expected) === null ? Message::get('expected_effect') : null,
            'duration', 'delay' => Expected::secondsError($expected),
            'trigger' => Vocabulary::normaliseTrigger($expected) === null ? Message::get('expected_trigger') : null,
            default => null,
        };
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

        $scope = $this->scope($file, $selector);

        if ($scope === []) {
            return CheckOutcome::fail(Message::get('found_no_animation'));
        }

        $firstFound = null;

        foreach ($scope as $animation) {
            $result = $this->single($selector->key, $item->expected, $animation);

            if ($result['passed']) {
                return CheckOutcome::pass($result['found']);
            }

            $firstFound ??= $result['found'];
        }

        return CheckOutcome::fail($firstFound);
    }

    /** @return list<AnimationModel> */
    private function scope(PresentationModel $file, Selector $selector): array
    {
        $slideNumber = $selector->get('slide');
        $slides = $slideNumber === null ? $file->slides : array_filter([$file->slide($slideNumber)]);
        $animations = [];

        foreach ($slides as $slide) {
            $shapeNumber = $selector->get('shape');

            if ($shapeNumber === null) {
                array_push($animations, ...$slide->animations);

                continue;
            }

            $shapeId = ($slide->shapes[$shapeNumber - 1] ?? null)?->id;

            foreach ($slide->animations as $animation) {
                if ($shapeId !== null && $animation->shapeId === $shapeId) {
                    $animations[] = $animation;
                }
            }
        }

        return $animations;
    }

    /** @return array{passed: bool, found: string} */
    private function single(string $key, string $expected, AnimationModel $animation): array
    {
        switch ($key) {
            case 'effect':
                return [
                    'passed' => $animation->effect === Vocabulary::normaliseEffect($expected),
                    'found' => Vocabulary::effectLabel($animation->effect).' ('.$this->classLabel($animation->class).')',
                ];

            case 'duration':
                $wanted = Expected::parseSeconds($expected);

                if ($animation->durationSeconds === null) {
                    return ['passed' => false, 'found' => Message::get('found_no_duration')];
                }

                return [
                    'passed' => $wanted !== null && abs($animation->durationSeconds - $wanted) <= Expected::SECONDS_TOLERANCE,
                    'found' => Expected::formatSeconds($animation->durationSeconds),
                ];

            case 'delay':
                $wanted = Expected::parseSeconds($expected);

                return [
                    'passed' => $wanted !== null && abs($animation->delaySeconds - $wanted) <= Expected::SECONDS_TOLERANCE,
                    'found' => Expected::formatSeconds($animation->delaySeconds),
                ];

            default:
                return [
                    'passed' => $animation->trigger === Vocabulary::normaliseTrigger($expected),
                    'found' => Vocabulary::triggerLabel($animation->trigger),
                ];
        }
    }

    private function classLabel(string $class): string
    {
        return match ($class) {
            'exit' => Message::get('class_exit'),
            'emphasis' => Message::get('class_emphasis'),
            'path' => Message::get('class_path'),
            default => Message::get('class_entrance'),
        };
    }
}
