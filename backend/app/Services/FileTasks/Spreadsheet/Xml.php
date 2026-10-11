<?php

declare(strict_types=1);

namespace App\Services\FileTasks\Spreadsheet;

use App\Services\Files\XmlSafety;
use App\Services\FileTasks\UnreadableFile;
use DOMElement;
use DOMNode;
use LibXMLError;
use XMLReader;

/**
 * Segedfuggvenyek a tablazat-olvasok XML-bejarasahoz.
 *
 * Az elemeket a helyi nevuk alapjan keressuk, nevter nelkul: ugyanaz az
 * OOXML-resz ket nevterrel is letezik (az atmeneti es a "Strict" valtozat),
 * es mindkettot olvasni kell.
 */
final class Xml
{
    /**
     * Nagy XML-resz bejarasa folyamolvasoval. A libxml hibai nem kerulnek a
     * kimenetre; ha az XML hibas vagy csonka, a bejaras utan UnreadableFile.
     *
     * @param  callable(XMLReader): void  $walk
     *
     * @throws UnreadableFile
     */
    public static function stream(string $xml, callable $walk): void
    {
        $reader = XmlSafety::reader($xml);
        $previous = libxml_use_internal_errors(true);
        libxml_clear_errors();

        try {
            $walk($reader);
            $error = libxml_get_last_error();
        } finally {
            $reader->close();
            libxml_clear_errors();
            libxml_use_internal_errors($previous);
        }

        if ($error instanceof LibXMLError && $error->level >= LIBXML_ERR_ERROR) {
            throw new UnreadableFile('Az XML hibas vagy csonka.');
        }
    }

    /**
     * A folyamolvaso minden elemet atadja a visszahivasnak. Ha az igazat ad
     * vissza, az elemet feldolgozottnak tekintjuk, es a teljes reszfajat
     * atugorjuk; kulonben a bejaras az elem gyerekeivel folytatodik.
     *
     * @param  callable(XMLReader): bool  $visit
     */
    public static function eachElement(XMLReader $reader, callable $visit): void
    {
        $more = $reader->read();

        while ($more) {
            $more = $reader->nodeType === XMLReader::ELEMENT && $visit($reader)
                ? $reader->next()
                : $reader->read();
        }
    }

    /** Az olvaso aktualis eleme DOM-reszfakent (egy sor, egy stiluslista); null, ha nem bonthato ki. */
    public static function expand(XMLReader $reader): ?DOMElement
    {
        $node = $reader->expand();

        return $node instanceof DOMElement ? $node : null;
    }

    /**
     * A csomopont kozvetlen gyerekelemei; helyi nevvel szukitve csak az olyan nevuek.
     *
     * @return list<DOMElement>
     */
    public static function children(DOMNode $node, ?string $localName = null): array
    {
        $children = [];

        foreach ($node->childNodes as $child) {
            if ($child instanceof DOMElement && ($localName === null || $child->localName === $localName)) {
                $children[] = $child;
            }
        }

        return $children;
    }

    public static function child(DOMNode $node, string $localName): ?DOMElement
    {
        foreach ($node->childNodes as $child) {
            if ($child instanceof DOMElement && $child->localName === $localName) {
                return $child;
            }
        }

        return null;
    }

    /**
     * A csomopont osszes ilyen helyi nevu leszarmazottja, dokumentumsorrendben.
     *
     * @return list<DOMElement>
     */
    public static function descendants(DOMNode $node, string $localName): array
    {
        $found = [];

        foreach ($node->childNodes as $child) {
            if (! $child instanceof DOMElement) {
                continue;
            }

            if ($child->localName === $localName) {
                $found[] = $child;
            }

            array_push($found, ...self::descendants($child, $localName));
        }

        return $found;
    }

    public static function descendant(DOMNode $node, string $localName): ?DOMElement
    {
        foreach ($node->childNodes as $child) {
            if (! $child instanceof DOMElement) {
                continue;
            }

            $match = $child->localName === $localName ? $child : self::descendant($child, $localName);

            if ($match !== null) {
                return $match;
            }
        }

        return null;
    }

    /** Elotag nelkuli attributum erteke; null, ha nincs. */
    public static function attribute(DOMElement $element, string $name): ?string
    {
        return $element->hasAttribute($name) ? $element->getAttribute($name) : null;
    }

    /**
     * Attributum erteke a helyi neve alapjan, barmilyen nevterben (pl. az
     * `r:id`, amelynek a nevtere a ket OOXML-valtozatban mas).
     */
    public static function attributeByLocalName(DOMElement $element, string $localName): ?string
    {
        foreach ($element->attributes as $attribute) {
            if ($attribute->localName === $localName) {
                return $attribute->value;
            }
        }

        return null;
    }

    /** Szamkent ertelmezheto attributum; null, ha nincs vagy nem szam. */
    public static function number(DOMElement $element, string $name): ?float
    {
        $value = self::attribute($element, $name);

        return $value !== null && is_numeric($value) ? (float) $value : null;
    }

    /** OOXML logikai attributum ("1", "true", "on"); hianyzo attributumnal az alapertek. */
    public static function flag(DOMElement $element, string $name, bool $default = false): bool
    {
        $value = self::attribute($element, $name);

        return $value === null ? $default : in_array(strtolower($value), ['1', 'true', 'on'], true);
    }
}
