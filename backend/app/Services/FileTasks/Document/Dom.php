<?php

declare(strict_types=1);

namespace App\Services\FileTasks\Document;

use DOMDocument;
use DOMElement;
use DOMNode;
use DOMXPath;

/**
 * Kis segédek a DOM-hoz: típusos elemlisták és névtér-attribútumok, hogy a
 * parserek ne a DOMNode|false visszatérésekkel küzdjenek. Csak olvas.
 */
final class Dom
{
    /**
     * XPath-kifejezés elemtalálatai (a nem elem csomópontokat eldobja).
     *
     * @return list<DOMElement>
     */
    public static function elements(DOMXPath $xpath, string $expression, ?DOMNode $context = null): array
    {
        $nodes = $context === null ? $xpath->query($expression) : $xpath->query($expression, $context);
        $elements = [];

        if ($nodes === false) {
            return $elements;
        }

        foreach ($nodes as $node) {
            if ($node instanceof DOMElement) {
                $elements[] = $node;
            }
        }

        return $elements;
    }

    public static function first(DOMXPath $xpath, string $expression, ?DOMNode $context = null): ?DOMElement
    {
        return self::elements($xpath, $expression, $context)[0] ?? null;
    }

    /**
     * A közvetlen gyerekelemek (helyi névvel, ha meg van adva).
     *
     * @return list<DOMElement>
     */
    public static function children(DOMNode $parent, ?string $localName = null): array
    {
        $children = [];

        foreach ($parent->childNodes as $child) {
            if ($child instanceof DOMElement && ($localName === null || $child->localName === $localName)) {
                $children[] = $child;
            }
        }

        return $children;
    }

    public static function child(?DOMNode $parent, string $localName): ?DOMElement
    {
        return $parent === null ? null : (self::children($parent, $localName)[0] ?? null);
    }

    /** Névtér-attribútum értéke; null, ha nincs az elemen. */
    public static function attr(?DOMElement $element, string $namespace, string $name): ?string
    {
        if ($element === null || ! $element->hasAttributeNS($namespace, $name)) {
            return null;
        }

        return $element->getAttributeNS($namespace, $name);
    }

    /**
     * A dokumentum XPath-eleme, a megadott névterekkel.
     *
     * @param  array<string, string>  $namespaces  prefix => URI
     */
    public static function xpath(DOMDocument $document, array $namespaces): DOMXPath
    {
        $xpath = new DOMXPath($document);

        foreach ($namespaces as $prefix => $uri) {
            $xpath->registerNamespace($prefix, $uri);
        }

        return $xpath;
    }
}
