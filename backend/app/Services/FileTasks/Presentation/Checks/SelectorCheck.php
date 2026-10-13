<?php

declare(strict_types=1);

namespace App\Services\FileTasks\Presentation\Checks;

use App\Services\FileTasks\CheckHandler;
use App\Services\FileTasks\Presentation\Message;
use App\Services\FileTasks\Presentation\Selector;

/**
 * Kozos alap a `kulcs[szelekter]` tulajdonsagu vizsgalatokhoz: a tulajdonsag
 * ertelmezese es a magyar hibauzenetek egy helyen.
 */
abstract class SelectorCheck implements CheckHandler
{
    /**
     * @param  list<string>  $keys  a megengedett tulajdonsagnevek
     * @param  list<string>  $selectors  a megengedett szelekternevek
     * @return Selector|string a tulajdonsag, vagy a magyar hibauzenet
     */
    protected function parseProperty(string $property, array $keys, array $selectors): Selector|string
    {
        $selector = Selector::parse($property, $selectors);

        if ($selector === null) {
            return Message::get('invalid_selector', [
                'property' => trim($property),
                'allowed' => $selectors === [] ? Message::get('no_selector') : implode(', ', array_map(static fn (string $name): string => '['.$name.'=N]', $selectors)),
            ]);
        }

        if (! in_array($selector->key, $keys, true)) {
            return Message::get('invalid_property', [
                'property' => trim($property),
                'allowed' => implode(', ', $keys),
            ]);
        }

        return $selector;
    }

    protected function selectorNotAllowed(string $key): string
    {
        return Message::get('selector_not_allowed', ['property' => $key]);
    }
}
