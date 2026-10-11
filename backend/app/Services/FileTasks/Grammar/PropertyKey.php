<?php

declare(strict_types=1);

namespace App\Services\FileTasks\Grammar;

/**
 * Az ertekelolap `property` mezojenek altalanos alakja: egy tulajdonsagkulcs,
 * utana legfeljebb egy szogletes zarojeles szelektor, pl. `column_width[A]`
 * vagy `title[sheet=Diagram]` (BACKEND.md 4.4.3).
 */
final readonly class PropertyKey
{
    private function __construct(
        /** A kulcs kisbetuvel, pl. "column_width". */
        public string $key,
        /** A szelektor tartalma a zarojelek nelkul, korulvagva; null, ha nincs szelektor. */
        public ?string $selector,
    ) {}

    /** Null, ha a szoveg nem `kulcs` vagy `kulcs[szelektor]` alaku. */
    public static function parse(string $property): ?self
    {
        if (preg_match('/^\s*([A-Za-z][A-Za-z0-9_]*)\s*(?:\[([^\[\]]*)\])?\s*$/', $property, $match) !== 1) {
            return null;
        }

        return new self(strtolower($match[1]), isset($match[2]) ? trim($match[2]) : null);
    }

    /**
     * A `nev=ertek` alaku szelektor erteke (pl. `sheet=Diagram` => "Diagram"),
     * vagy null, ha a szelektor nem ilyen nevu.
     */
    public function selectorValue(string $name): ?string
    {
        if ($this->selector === null) {
            return null;
        }

        $parts = explode('=', $this->selector, 2);

        if (count($parts) !== 2 || strtolower(trim($parts[0])) !== $name) {
            return null;
        }

        $value = trim($parts[1]);

        return $value === '' ? null : $value;
    }
}
