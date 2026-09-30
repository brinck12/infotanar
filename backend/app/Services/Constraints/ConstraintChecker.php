<?php

declare(strict_types=1);

namespace App\Services\Constraints;

use App\Enums\RequiredConstruct;
use Illuminate\Support\Facades\Config;

/**
 * Egy feladat szabalyainak (ConstraintSet) ellenorzese egy beadott megoldason.
 * Python: AST-elemzes (#43); C#: lexikalis elemzes (#86). Mas nyelvnel (pl.
 * SQL) nincs ellenorzes.
 */
final readonly class ConstraintChecker
{
    public const ENFORCED_LANGUAGES = ['python', 'csharp'];

    public function __construct(
        private PythonAstAnalyzer $python,
        private CSharpAnalyzer $csharp,
    ) {}

    /**
     * @return list<string> a megsertett szabalyok magyar leirasa; ures = rendben
     */
    public function violations(ConstraintSet $constraints, string $language, string $sourceCode): array
    {
        if ($constraints->isEmpty()) {
            return [];
        }

        $analysis = match ($language) {
            'python' => $this->python->analyze($sourceCode),
            'csharp' => $this->csharp->analyze($sourceCode),
            default => null,
        };

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
            $violation = $language === 'csharp'
                ? $this->csharpViolation($analysis, $prohibition)
                : $this->pythonViolation($analysis, $prohibition);

            if ($violation !== null) {
                $violations[] = $violation;
            }
        }

        // Egy hivas tobb szabalyt is serthet (pl. Sort(): builtin:sorted es method:sort) - egyszer jelezzuk.
        return array_values(array_unique($violations));
    }

    private function pythonViolation(CodeAnalysis $analysis, Prohibition $prohibition): ?string
    {
        $used = $prohibition->kind === Prohibition::BUILTIN
            ? in_array($prohibition->name, $analysis->builtinCalls, true) || $analysis->dynamicCalls
            : in_array($prohibition->name, $analysis->methodCalls, true);

        return $used ? self::t('constraints.violation.forbid', ['rule' => $prohibition->describe()]) : null;
    }

    /** C#-ban minden tiltas tagfuggveny-hivaskent jelenik meg (.Sum(), Math.Max(), Array.Sort()). */
    private function csharpViolation(CodeAnalysis $analysis, Prohibition $prohibition): ?string
    {
        $found = array_values(array_intersect($this->csharpNames($prohibition), $analysis->methodCalls));

        if ($found !== []) {
            return self::t('constraints.violation.forbid_csharp', [
                'names' => implode(', ', array_map(static fn (string $name): string => $name.'()', $found)),
            ]);
        }

        // Reflexio / dynamic: barmely tiltott hivas megkerulheto lenne vele.
        return $analysis->dynamicCalls ? self::t('constraints.violation.dynamic') : null;
    }

    /** @return list<string> */
    private function csharpNames(Prohibition $prohibition): array
    {
        $aliases = Config::array('constraints.csharp_aliases');
        $names = $aliases[$prohibition->key()] ?? [ucfirst($prohibition->name)];

        return is_array($names) ? array_values(array_filter($names, is_string(...))) : [];
    }

    /** @param array<string, string> $replace */
    private static function t(string $key, array $replace = []): string
    {
        $line = __($key, $replace);

        return is_string($line) ? $line : $key;
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
