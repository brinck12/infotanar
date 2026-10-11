<?php

declare(strict_types=1);

namespace App\Services\Execution\Subtasks;

/**
 * Egy kimenet felbontasa reszfeladatonkenti szakaszokra.
 *
 * Az erettsegin a program minden resz elott kiirja a sorszamat ("3. feladat").
 * Fejlecnek az a sor szamit, amely a sorszammal es a "feladat" szoval
 * kezdodik: "1. feladat", "1.feladat", "1) Feladat", "2. feladat: 42".
 * A szakasz a fejlec utani szoveg a kovetkezo fejlecig; a fejlec soraban a
 * "feladat" szo utan allo szoveg is hozza tartozik, igy az egysoros
 * "2. feladat: 42" es a ketsoros "2. feladat" + "42" ugyanazt adja. Az elso
 * fejlec elotti szoveg egyik reszfeladathoz sem tartozik.
 *
 * A fejlec felismerese ekezetfuggetlen: a minta a "feladat" maganhangzoit
 * ekezettel is elfogadja, igy a sort nem kell atirni, es a szakasz szovege
 * pontosan az marad, amit a program kiirt.
 */
final class SubtaskSections
{
    private const HEADER = '/^\s*(\d{1,2})\s*[.)]?\s*f[eé]l[aá]d[aá]t\b\s*[:.]?\s*(.*)$/iu';

    /**
     * @return array<int, string> sorszam => a szakasz szovege; ismetelt sorszamnal az elso szamit
     */
    public static function split(string $output): array
    {
        /** @var array<int, list<string>> $sections */
        $sections = [];
        $current = null;
        $repeated = false;

        foreach (explode("\n", str_replace("\r\n", "\n", $output)) as $line) {
            $header = self::header($line);

            if ($header !== null) {
                [$current, $rest] = $header;
                $repeated = isset($sections[$current]);

                if (! $repeated) {
                    $sections[$current] = $rest === '' ? [] : [$rest];
                }

                continue;
            }

            if ($current !== null && ! $repeated) {
                $sections[$current][] = $line;
            }
        }

        return array_map(static fn (array $lines): string => implode("\n", $lines), $sections);
    }

    /** @return array{int, string}|null a sorszam es a fejlec soraban utana allo szoveg */
    private static function header(string $line): ?array
    {
        // Nem UTF-8 sorra a /u minta hibat ad (false): az ilyen sor nem fejlec.
        if (preg_match(self::HEADER, $line, $matches) !== 1) {
            return null;
        }

        return [(int) $matches[1], rtrim($matches[2])];
    }
}
