<?php

declare(strict_types=1);

namespace App\Services\Constraints;

/**
 * C# megoldasok szerkezetenek kinyerese forditas es futtatas nelkul (#86).
 *
 * A szerveren nincs .NET/Roslyn, ezert egy konnyu, lexikalis elemzo: a
 * megjegyzeseket es szoveg-/karakterliteralokat eltavolitja, majd a C#
 * kulcsszavai es a tagfuggveny-hivasok alapjan dont. Erettsegi-meretu
 * programokra ez megbizhato; a trukkoket (reflexio, dynamic) "dynamic"-kent
 * jelzi, igy azokkal sem kerulheto meg egy tiltas.
 *
 * A `methodCalls` itt a nyers C# tagnevek (pl. "Sum", "Max", "Sort"); a
 * szabalynevekre a ConstraintChecker kepezi le oket (constraints.csharp_aliases).
 */
final class CSharpAnalyzer
{
    private const DYNAMIC_MEMBERS = ['GetMethod', 'GetMethods', 'Invoke', 'InvokeMember', 'CreateDelegate', 'DynamicInvoke'];

    public function analyze(string $sourceCode): CodeAnalysis
    {
        $code = $this->stripCommentsAndLiterals($sourceCode);

        preg_match_all('/\.\s*([A-Za-z_]\w*)\s*(?:<[^<>;()]*>)?\s*\(/', $code, $members);
        $memberCalls = array_values(array_unique($members[1]));

        return new CodeAnalysis(
            forLoop: preg_match('/\b(?:for|foreach)\s*\(/', $code) === 1,
            whileLoop: preg_match('/\bwhile\s*\(|\bdo\s*\{/', $code) === 1,
            recursion: $this->hasRecursion($code),
            builtinCalls: [],
            methodCalls: $memberCalls,
            dynamicCalls: preg_match('/\bdynamic\b/', $code) === 1
                || array_intersect($memberCalls, self::DYNAMIC_MEMBERS) !== [],
        );
    }

    /**
     * Megjegyzesek, szovegek ("...", @"...", $"...") es karakterek ('x')
     * helyere szokoz: igy a bennuk levo "for (" vagy ".Sum(" nem szamit.
     */
    private function stripCommentsAndLiterals(string $code): string
    {
        $out = '';
        $length = strlen($code);

        for ($i = 0; $i < $length; $i++) {
            $char = $code[$i];
            $next = $code[$i + 1] ?? '';

            if ($char === '/' && $next === '/') {
                while ($i < $length && $code[$i] !== "\n") {
                    $i++;
                }
                $out .= "\n";

                continue;
            }

            if ($char === '/' && $next === '*') {
                $end = strpos($code, '*/', $i + 2);
                $i = $end === false ? $length : $end + 1;
                $out .= ' ';

                continue;
            }

            $verbatim = $char === '@' && $next === '"' || ($char === '$' && $next === '@' && ($code[$i + 2] ?? '') === '"') || ($char === '@' && $next === '$' && ($code[$i + 2] ?? '') === '"');
            if ($verbatim || $char === '"' || ($char === '$' && $next === '"')) {
                while ($i < $length && $code[$i] !== '"') {
                    $i++;
                }
                $i++;
                while ($i < $length) {
                    if ($verbatim && $code[$i] === '"' && ($code[$i + 1] ?? '') === '"') {
                        $i += 2;

                        continue;
                    }
                    if (! $verbatim && $code[$i] === '\\') {
                        $i += 2;

                        continue;
                    }
                    if ($code[$i] === '"') {
                        break;
                    }
                    $i++;
                }
                $out .= '""';

                continue;
            }

            if ($char === "'") {
                $i++;
                while ($i < $length && $code[$i] !== "'") {
                    $i += $code[$i] === '\\' ? 2 : 1;
                }
                $out .= "' '";

                continue;
            }

            $out .= $char;
        }

        return $out;
    }

    /** Egy metodus torzse (kapcsos zarojelek szerint) hivja-e a sajat nevet. */
    private function hasRecursion(string $code): bool
    {
        $pattern = '/\b(?:static\s+|public\s+|private\s+|protected\s+|internal\s+)*[\w<>\[\],?]+\s+([A-Za-z_]\w*)\s*\([^;{}()]*\)\s*\{/';

        if (preg_match_all($pattern, $code, $matches, PREG_OFFSET_CAPTURE) === false) {
            return false;
        }

        foreach ($matches[1] as $index => [$name]) {
            if (in_array($name, ['if', 'for', 'foreach', 'while', 'switch', 'catch', 'using', 'lock'], true)) {
                continue;
            }

            $bodyStart = $matches[0][$index][1] + strlen($matches[0][$index][0]);
            $body = $this->blockFrom($code, $bodyStart);

            if (preg_match('/(?<![\w.])'.preg_quote($name, '/').'\s*\(/', $body) === 1) {
                return true;
            }
        }

        return false;
    }

    /** A nyito `{` utani tartalom a hozza tartozo `}`-ig. */
    private function blockFrom(string $code, int $start): string
    {
        $depth = 1;
        $length = strlen($code);

        for ($i = $start; $i < $length; $i++) {
            if ($code[$i] === '{') {
                $depth++;
            } elseif ($code[$i] === '}' && --$depth === 0) {
                return substr($code, $start, $i - $start);
            }
        }

        return substr($code, $start);
    }
}
