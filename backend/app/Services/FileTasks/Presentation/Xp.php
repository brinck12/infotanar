<?php

declare(strict_types=1);

namespace App\Services\FileTasks\Presentation;

use DOMDocument;
use DOMElement;
use DOMNode;
use DOMNodeList;
use DOMXPath;

/**
 * Tipusos burok a DOMXPath korul: a parserek igy nem kezelnek `false`
 * visszateresi erteket es nem tipuskenyszeritenek. A kifejezesek fix
 * nevterekkel dolgoznak, amelyeket a hivo regisztral.
 */
final readonly class Xp
{
    private function __construct(private DOMXPath $xpath) {}

    /**
     * @param  array<string, string>  $namespaces  elotag => nevter
     */
    public static function for(DOMDocument $document, array $namespaces): self
    {
        $xpath = new DOMXPath($document);

        foreach ($namespaces as $prefix => $uri) {
            $xpath->registerNamespace($prefix, $uri);
        }

        return new self($xpath);
    }

    /** @return list<DOMElement> */
    public function elements(string $expression, ?DOMNode $context = null): array
    {
        $result = $context === null ? $this->xpath->query($expression) : $this->xpath->query($expression, $context);

        if (! $result instanceof DOMNodeList) {
            return [];
        }

        $elements = [];

        foreach ($result as $node) {
            if ($node instanceof DOMElement) {
                $elements[] = $node;
            }
        }

        return $elements;
    }

    public function element(string $expression, ?DOMNode $context = null): ?DOMElement
    {
        return $this->elements($expression, $context)[0] ?? null;
    }

    /** A kifejezes szovegerteke (ures szoveg, ha nincs talalat). */
    public function string(string $expression, ?DOMNode $context = null): string
    {
        $result = $context === null
            ? $this->xpath->evaluate('string('.$expression.')')
            : $this->xpath->evaluate('string('.$expression.')', $context);

        return is_string($result) ? $result : '';
    }

    /** Van-e talalat. */
    public function exists(string $expression, ?DOMNode $context = null): bool
    {
        $result = $context === null ? $this->xpath->evaluate('count('.$expression.')') : $this->xpath->evaluate('count('.$expression.')', $context);

        return is_numeric($result) && (float) $result > 0;
    }
}
