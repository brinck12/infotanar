<?php

declare(strict_types=1);

namespace App\Services\Constraints;

use App\Enums\RequiredConstruct;

/**
 * Egy feladat szabalyainak (ConstraintSet) ellenorzese egy beadott megoldason.
 * Jelenleg Python megoldasokra; mas nyelvnel nincs ellenorzes (ures lista).
 */
final readonly class ConstraintChecker
{
    public function __construct(private PythonAstAnalyzer $analyzer) {}

    /**
     * @return list<string> a megsertett szabalyok magyar leirasa; ures = rendben
     */
    public function violations(ConstraintSet $constraints, string $language, string $sourceCode): array
    {
        if ($constraints->isEmpty() || $language !== 'python') {
            return [];
        }

        $analysis = $this->analyzer->analyze($sourceCode);
        if ($analysis === null) {
            return [];
        }

        $violations = [];

        foreach ($constraints->require as $construct) {
            if (! $this->contains($analysis, $construct)) {
                $violations[] = __('constraints.violation.require', ['rule' => $construct->describe()]);
            }
        }

        foreach ($constraints->forbid as $prohibition) {
            $used = $prohibition->kind === Prohibition::BUILTIN
                ? in_array($prohibition->name, $analysis->builtinCalls, true) || $analysis->dynamicCalls
                : in_array($prohibition->name, $analysis->methodCalls, true);

            if ($used) {
                $violations[] = __('constraints.violation.forbid', ['rule' => $prohibition->describe()]);
            }
        }

        return $violations;
    }

    private function contains(CodeAnalysis $analysis, RequiredConstruct $construct): bool
    {
        return match ($construct) {
            RequiredConstruct::ForLoop => $analysis->forLoop,
            RequiredConstruct::WhileLoop => $analysis->whileLoop,
            RequiredConstruct::Loop => $analysis->forLoop || $analysis->whileLoop,
            RequiredConstruct::Recursion => $analysis->recursion,
        };
    }
}
