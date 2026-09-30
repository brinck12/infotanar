<?php

declare(strict_types=1);

namespace App\Services\Constraints;

/** A Python elemzo eredmenye (resources/python/constraint_analyzer.py). */
final readonly class CodeAnalysis
{
    /**
     * @param  list<string>  $builtinCalls  hivott beepitett fuggvenyek (a sajat definiciokat nem szamitva)
     * @param  list<string>  $methodCalls  hivott metodusnevek (x.nev(...))
     */
    public function __construct(
        public bool $forLoop,
        public bool $whileLoop,
        public bool $recursion,
        public array $builtinCalls,
        public array $methodCalls,
        /** eval/exec/getattr vagy a builtins modul: barmely tiltas megkerulheto vele. */
        public bool $dynamicCalls,
    ) {}
}
