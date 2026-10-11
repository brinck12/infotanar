<?php

declare(strict_types=1);

namespace App\Services\FileTasks\Spreadsheet;

use DOMElement;
use DOMNode;

/**
 * Az OpenDocument nevterei es nevter-tudatos attributum-olvaso. Az ODF
 * attributumai elotaggal (`table:style-name`) vannak, ezert itt nevterrel
 * keresunk, nem az elotag szovegevel.
 */
final class OdfNs
{
    public const OFFICE = 'urn:oasis:names:tc:opendocument:xmlns:office:1.0';

    public const TABLE = 'urn:oasis:names:tc:opendocument:xmlns:table:1.0';

    public const STYLE = 'urn:oasis:names:tc:opendocument:xmlns:style:1.0';

    public const TEXT = 'urn:oasis:names:tc:opendocument:xmlns:text:1.0';

    public const NUMBER = 'urn:oasis:names:tc:opendocument:xmlns:datastyle:1.0';

    public const FO = 'urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0';

    public const DRAW = 'urn:oasis:names:tc:opendocument:xmlns:drawing:1.0';

    public const CHART = 'urn:oasis:names:tc:opendocument:xmlns:chart:1.0';

    public const XLINK = 'http://www.w3.org/1999/xlink';

    public const CALCEXT = 'urn:org:documentfoundation:names:experimental:calc:xmlns:calcext:1.0';

    public static function attribute(DOMElement $element, string $namespace, string $name): ?string
    {
        return $element->hasAttributeNS($namespace, $name) ? $element->getAttributeNS($namespace, $name) : null;
    }

    /**
     * A kozvetlen gyerekelemek adott nevterbol es helyi nevvel.
     *
     * @return list<DOMElement>
     */
    public static function children(DOMNode $node, string $namespace, string $localName): array
    {
        $found = [];

        foreach ($node->childNodes as $child) {
            if ($child instanceof DOMElement && $child->namespaceURI === $namespace && $child->localName === $localName) {
                $found[] = $child;
            }
        }

        return $found;
    }

    public static function child(DOMNode $node, string $namespace, string $localName): ?DOMElement
    {
        return self::children($node, $namespace, $localName)[0] ?? null;
    }

    /**
     * Egy bekezdes (`text:p`) szovege: a szokozok (`text:s`), tabulatorok es
     * sortorések kifejtve, a formazo elemek (`text:span`, `text:a`) szovegevel.
     */
    public static function paragraphText(DOMNode $paragraph): string
    {
        $text = '';

        foreach ($paragraph->childNodes as $child) {
            if ($child instanceof DOMElement) {
                if ($child->namespaceURI === self::TEXT && $child->localName === 's') {
                    $text .= str_repeat(' ', min(1000, max(1, (int) (self::attribute($child, self::TEXT, 'c') ?? 1))));
                } elseif ($child->namespaceURI === self::TEXT && $child->localName === 'tab') {
                    $text .= "\t";
                } elseif ($child->namespaceURI === self::TEXT && $child->localName === 'line-break') {
                    $text .= "\n";
                } else {
                    $text .= self::paragraphText($child);
                }
            } else {
                $text .= $child->textContent;
            }
        }

        return $text;
    }

    /** Egy elem alatti osszes bekezdes szovege, soronkent. */
    public static function textOf(DOMNode $node): string
    {
        $lines = [];

        foreach (self::children($node, self::TEXT, 'p') as $paragraph) {
            $lines[] = self::paragraphText($paragraph);
        }

        return implode("\n", $lines);
    }
}
