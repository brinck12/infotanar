<?php

declare(strict_types=1);

namespace App\Services\FileTasks\Presentation;

use DOMDocument;
use DOMElement;

/**
 * Az ODF stilusok (automatikus es kozos) egy szotarban: csalad + nev =>
 * szulo es tulajdonsagok. A tulajdonsagokat a `*-properties` elemek
 * attributumaibol gyujti, a helyi nevuk szerint (pl. `fill`, `font-size`).
 *
 * A keresés a szulo-lancon felfele megy, a vegen a csalad alapertelmezett
 * stilusaval (style:default-style). Eloszor a styles.xml, aztan a content.xml
 * tolt: a dia tartalma a sajat automatikus stilusait latja elol.
 */
final class OdfStyles
{
    private const NS_STYLE = 'urn:oasis:names:tc:opendocument:xmlns:style:1.0';

    private const MAX_DEPTH = 12;

    /** @var array<string, array{parent: string|null, props: array<string, string>}> */
    private array $styles = [];

    /** @var array<string, array<string, string>> csalad => tulajdonsagok */
    private array $defaults = [];

    public function add(DOMDocument $document): void
    {
        $xp = Xp::for($document, ['style' => self::NS_STYLE]);

        foreach ($xp->elements('//style:style | //style:default-style') as $style) {
            $family = $style->getAttributeNS(self::NS_STYLE, 'family');
            $props = $this->properties($style);

            if ($style->localName === 'default-style') {
                $this->defaults[$family] = $props + ($this->defaults[$family] ?? []);

                continue;
            }

            $name = $style->getAttributeNS(self::NS_STYLE, 'name');
            $parent = $style->getAttributeNS(self::NS_STYLE, 'parent-style-name');
            $this->styles[$family.'|'.$name] = ['parent' => $parent === '' ? null : $parent, 'props' => $props];
        }
    }

    /** A tulajdonsag erteke a stilus szulo-lancan (es a csalad alapertelmezesen) at; null, ha nincs. */
    public function lookup(string $family, ?string $name, string $property): ?string
    {
        $current = $name;

        for ($depth = 0; $current !== null && $current !== '' && $depth < self::MAX_DEPTH; $depth++) {
            $style = $this->styles[$family.'|'.$current] ?? null;

            if ($style === null) {
                break;
            }

            if (isset($style['props'][$property])) {
                return $style['props'][$property];
            }

            $current = $style['parent'];
        }

        return $this->defaults[$family][$property] ?? null;
    }

    /** Van-e ilyen nevu stilus a csaladban. */
    public function has(string $family, string $name): bool
    {
        return isset($this->styles[$family.'|'.$name]);
    }

    /**
     * Az elso stilus neve, amely a megadott vegzodesu es a csaladban van (pl. "-title").
     *
     * @return list<string>
     */
    public function namesEndingWith(string $family, string $suffix): array
    {
        $names = [];
        $prefix = $family.'|';

        foreach (array_keys($this->styles) as $key) {
            if (str_starts_with($key, $prefix) && str_ends_with($key, $suffix)) {
                $names[] = substr($key, strlen($prefix));
            }
        }

        return $names;
    }

    /** @return array<string, string> */
    private function properties(DOMElement $style): array
    {
        $props = [];

        foreach ($style->childNodes as $child) {
            if (! $child instanceof DOMElement || ! str_ends_with((string) $child->localName, '-properties')) {
                continue;
            }

            foreach ($child->attributes ?? [] as $attribute) {
                $props[$attribute->localName] = (string) $attribute->nodeValue;
            }
        }

        return $props;
    }
}
