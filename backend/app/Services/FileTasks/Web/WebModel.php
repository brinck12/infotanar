<?php

declare(strict_types=1);

namespace App\Services\FileTasks\Web;

use App\Services\FileTasks\Fact;
use App\Services\FileTasks\OpenedFile;
use App\Services\FileTasks\Presentation\Message;
use App\Services\FileTasks\Presentation\Xp;
use DOMDocument;
use DOMElement;

/**
 * Egy megnyitott weboldal (html) vagy stilusfajl (css). A HTML-t a DOM-on
 * keresztul kerdezzuk; a CSS-szabalyok a <style> elemekbol (html), illetve
 * a fajlbol (css) szarmaznak. Kulso stilusfajlt (<link>) nem toltunk be:
 * a diak egyetlen fajlt ad be.
 */
final readonly class WebModel implements OpenedFile
{
    private const SHORTHAND_SIDES = ['margin', 'padding'];

    private const BORDER_STYLES = ['none', 'hidden', 'dotted', 'dashed', 'solid', 'double', 'groove', 'ridge', 'inset', 'outset'];

    /**
     * @param  list<CssRule>  $rules
     */
    public function __construct(
        public ?DOMDocument $document,
        public array $rules,
        public ?Xp $xp = null,
    ) {}

    public function isHtml(): bool
    {
        return $this->document !== null;
    }

    public function title(): ?string
    {
        if ($this->xp === null) {
            return null;
        }

        $title = $this->xp->element('//title');

        return $title === null ? null : trim((string) preg_replace('/\s+/u', ' ', $title->textContent));
    }

    /**
     * Az egyszeru szelektornak (tag, .osztaly, #id, tag.osztaly) megfelelo elemek.
     *
     * @return list<DOMElement>
     */
    public function elements(string $selector): array
    {
        $expression = self::xpathFor($selector);

        return $this->xp === null || $expression === null ? [] : $this->xp->elements($expression);
    }

    public function classUsed(string $class): bool
    {
        return $this->elements('.'.$class) !== [];
    }

    /** @return list<DOMElement> */
    public function images(): array
    {
        return $this->xp === null ? [] : $this->xp->elements('//img');
    }

    /** @return list<DOMElement> */
    public function links(): array
    {
        return $this->xp === null ? [] : $this->xp->elements('//a[@href]');
    }

    /**
     * A CSS-tulajdonsag ervenyes erteke a szelektorra: a feltetel nelkuli
     * szabalyok kozul az utolso nyer (az !important elony), a beagyazott
     * `style` attributum azokat feluliras. Rovidítesek (margin, padding,
     * background, border) a megfelelo reszletes tulajdonsagra is hatnak.
     */
    public function cssValue(string $selector, string $property): ?string
    {
        $value = null;
        $important = false;

        foreach ($this->rules as $rule) {
            if ($rule->media !== null || $rule->selector !== $selector) {
                continue;
            }

            foreach ($rule->declarations as [$name, $declared, $isImportant]) {
                $expanded = self::expand($name, $declared)[$property] ?? null;

                if ($expanded !== null && ($isImportant || ! $important)) {
                    $value = $expanded;
                    $important = $isImportant;
                }
            }
        }

        if (! $important) {
            foreach ($this->elements($selector) as $element) {
                foreach ($this->inlineDeclarations($element) as [$name, $declared]) {
                    $expanded = self::expand($name, $declared)[$property] ?? null;

                    if ($expanded !== null) {
                        return $expanded;
                    }
                }
            }
        }

        return $value;
    }

    /** Van-e a szelektorra a tulajdonsagot beallito deklaracio feltetelhez kotott (@media) szabalyban. */
    public function cssValueOnlyInMedia(string $selector, string $property): bool
    {
        foreach ($this->rules as $rule) {
            if ($rule->media === null || $rule->selector !== $selector) {
                continue;
            }

            foreach ($rule->declarations as [$name, $declared]) {
                if (isset(self::expand($name, $declared)[$property])) {
                    return true;
                }
            }
        }

        return false;
    }

    /** @return list<Fact> */
    public function facts(): array
    {
        if ($this->xp === null) {
            return [new Fact(Message::get('fact_css_rules'), (string) count($this->rules))];
        }

        $facts = [];
        $title = $this->title();

        if ($title !== null && $title !== '') {
            $facts[] = new Fact(Message::get('fact_title'), mb_strimwidth($title, 0, 80, '…', 'UTF-8'));
        }

        $facts[] = new Fact(Message::get('fact_elements'), Message::get('elements_summary', [
            'total' => count($this->xp->elements('//body//*')),
            'headings' => count($this->xp->elements('//*[self::h1 or self::h2 or self::h3 or self::h4 or self::h5 or self::h6]')),
            'paragraphs' => count($this->xp->elements('//p')),
            'images' => count($this->images()),
            'links' => count($this->links()),
        ]));

        return $facts;
    }

    /** A szelektorbol XPath; null, ha a szelektor nem egyszeru. */
    public static function xpathFor(string $selector): ?string
    {
        if (preg_match('/^([a-zA-Z][a-zA-Z0-9]*)?(?:([.#])([A-Za-z_][\w-]*))?$/', $selector, $match) !== 1 || $selector === '') {
            return null;
        }

        $tag = ($match[1] ?? '') === '' ? '*' : strtolower($match[1]);
        $condition = '';

        if (($match[2] ?? '') === '.') {
            $condition = "[contains(concat(' ', normalize-space(@class), ' '), ' ".($match[3] ?? '')." ')]";
        } elseif (($match[2] ?? '') === '#') {
            $condition = "[@id='".($match[3] ?? '')."']";
        }

        return '//'.$tag.$condition;
    }

    /** @return list<array{0: string, 1: string}> */
    private function inlineDeclarations(DOMElement $element): array
    {
        $declarations = [];

        foreach (explode(';', $element->getAttribute('style')) as $part) {
            $colon = strpos($part, ':');

            if ($colon !== false) {
                $declarations[] = [strtolower(trim(substr($part, 0, $colon))), trim(substr($part, $colon + 1))];
            }
        }

        return $declarations;
    }

    /**
     * Egy deklaracio hatasa: maga a tulajdonsag es a rovidítesbol szarmazo reszletes tulajdonsagok.
     *
     * @return array<string, string>
     */
    private static function expand(string $name, string $value): array
    {
        $expanded = [$name => $value];
        $tokens = preg_split('/\s+/', trim($value)) ?: [];

        if (in_array($name, self::SHORTHAND_SIDES, true) && $tokens !== [] && count($tokens) <= 4) {
            [$top, $right, $bottom, $left] = match (count($tokens)) {
                1 => [$tokens[0], $tokens[0], $tokens[0], $tokens[0]],
                2 => [$tokens[0], $tokens[1], $tokens[0], $tokens[1]],
                3 => [$tokens[0], $tokens[1], $tokens[2], $tokens[1]],
                default => [$tokens[0], $tokens[1], $tokens[2], $tokens[3]],
            };

            return $expanded + [$name.'-top' => $top, $name.'-right' => $right, $name.'-bottom' => $bottom, $name.'-left' => $left];
        }

        if ($name === 'background') {
            foreach ($tokens as $token) {
                if (CssColors::parse($token) !== null) {
                    $expanded['background-color'] = $token;
                }
            }
        }

        if ($name === 'border') {
            foreach ($tokens as $token) {
                if (in_array(strtolower($token), self::BORDER_STYLES, true)) {
                    $expanded['border-style'] = $token;
                } elseif (preg_match('/^\d*\.?\d+[a-z%]*$/i', $token) === 1 || in_array(strtolower($token), ['thin', 'medium', 'thick'], true)) {
                    $expanded['border-width'] = $token;
                } elseif (CssColors::parse($token) !== null) {
                    $expanded['border-color'] = $token;
                }
            }
        }

        return $expanded;
    }
}
