<?php

declare(strict_types=1);

namespace App\Services\FileTasks\Presentation;

/**
 * Egy `tulajdonsag[slide=2,shape=1]` alaku vizsgalati kulcs: a tulajdonsag
 * neve es a szelekterek (egesz szamok, 1-tol). Az ossze is irhato alak
 * (`[slide=2,shape=1]`) es a kulon zarojeles (`[slide=2][shape=1]`) is jo.
 */
final readonly class Selector
{
    /**
     * @param  array<string, int>  $parts  szelekter neve => sorszam
     */
    private function __construct(
        public string $key,
        public array $parts,
    ) {}

    /**
     * @param  list<string>  $allowed  a megengedett szelekternevek (pl. ["slide", "shape"])
     */
    public static function parse(string $property, array $allowed): ?self
    {
        if (preg_match('/^\s*([A-Za-z][A-Za-z0-9_]*)\s*((?:\[[^\[\]]*\]\s*)*)$/', $property, $match) !== 1) {
            return null;
        }

        $parts = [];

        if ($match[2] !== '') {
            preg_match_all('/\[([^\[\]]*)\]/', $match[2], $groups);

            foreach ($groups[1] as $group) {
                foreach (explode(',', $group) as $term) {
                    $pair = explode('=', $term, 2);
                    $name = strtolower(trim($pair[0]));
                    $value = trim($pair[1] ?? '');

                    if (! in_array($name, $allowed, true) || isset($parts[$name]) || preg_match('/^[1-9]\d{0,5}$/', $value) !== 1) {
                        return null;
                    }

                    $parts[$name] = (int) $value;
                }
            }
        }

        return new self(strtolower($match[1]), $parts);
    }

    public function get(string $name): ?int
    {
        return $this->parts[$name] ?? null;
    }

    public function has(string $name): bool
    {
        return isset($this->parts[$name]);
    }

    /** Nincs benne egyetlen szelekter sem. */
    public function isEmpty(): bool
    {
        return $this->parts === [];
    }
}
