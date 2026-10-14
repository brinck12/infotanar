<?php

declare(strict_types=1);

namespace App\Services\FileTasks\Document\Checks;

use App\Models\RubricItem;
use App\Services\FileTasks\CheckHandler;
use App\Services\FileTasks\CheckOutcome;
use App\Services\FileTasks\Document\DocumentModel;
use App\Services\FileTasks\Document\DocumentSelector;
use App\Services\FileTasks\Document\ParagraphInfo;
use App\Services\FileTasks\Grammar\Booleans;
use App\Services\FileTasks\Grammar\Lengths;
use App\Services\FileTasks\Grammar\Numbers;
use App\Services\FileTasks\Grammar\PropertyKey;
use App\Services\FileTasks\OpenedFile;
use Closure;
use LogicException;

/**
 * A dokumentum-vizsgálatok közös váza: a `property` felbontása és ellenőrzése
 * szerkesztéskor (validate) és értékeléskor (evaluate) ugyanabból a
 * `properties()` táblából dolgozik, így minden elmentett pont végrehajtható.
 */
abstract class AbstractDocumentCheck implements CheckHandler
{
    /** A bekezdésre mutató szelektorok. */
    protected const PARAGRAPH_SELECTORS = ['paragraph', 'style', 'text', 'heading'];

    /**
     * A megengedett tulajdonságkulcsok és a hozzájuk adható szelektorfajták
     * (üres lista: szelektor nem adható).
     *
     * @return array<string, list<string>>
     */
    abstract protected function properties(): array;

    /** @return string|null magyar hibaüzenet az elvárt értékre, vagy null */
    abstract protected function expectedError(string $key, string $expected, ?DocumentSelector $selector): ?string;

    abstract protected function inspect(DocumentModel $document, string $key, ?DocumentSelector $selector, string $expected): CheckOutcome;

    /** Kell-e a kulcshoz kötelezően szelektor. */
    protected function requiresSelector(string $key): bool
    {
        return false;
    }

    final public function supports(OpenedFile $file): bool
    {
        return $file instanceof DocumentModel;
    }

    final public function validate(string $property, string $expected): ?string
    {
        $parsed = PropertyKey::parse($property);

        if ($parsed === null) {
            return $this->message('error.property_shape');
        }

        $allowedSelectors = $this->properties()[$parsed->key] ?? null;

        if ($allowedSelectors === null) {
            return $this->message('error.property_unknown', [
                'property' => $parsed->key,
                'allowed' => implode(', ', array_keys($this->properties())),
            ]);
        }

        $selector = null;

        if ($parsed->selector === null) {
            if ($this->requiresSelector($parsed->key)) {
                return $this->message('error.selector_required', ['allowed' => implode(', ', $allowedSelectors)]);
            }
        } elseif ($allowedSelectors === []) {
            return $this->message('error.selector_not_allowed', ['property' => $parsed->key]);
        } elseif (($selector = DocumentSelector::parse($parsed->selector, $allowedSelectors)) === null) {
            return $this->message('error.selector_invalid', [
                'selector' => $parsed->selector,
                'allowed' => implode(', ', $allowedSelectors),
            ]);
        }

        return $this->expectedError($parsed->key, trim($expected), $selector);
    }

    final public function evaluate(OpenedFile $file, RubricItem $item): CheckOutcome
    {
        if (! $file instanceof DocumentModel) {
            throw new LogicException('A vizsgálat csak dokumentumot értékel.');
        }

        $parsed = PropertyKey::parse($item->property)
            ?? throw new LogicException('Érvénytelen tulajdonság az értékelőlapon.');
        $selector = $parsed->selector === null
            ? null
            : DocumentSelector::parse($parsed->selector, $this->properties()[$parsed->key] ?? []);

        if ($parsed->selector !== null && $selector === null) {
            throw new LogicException('Érvénytelen szelektor az értékelőlapon.');
        }

        return $this->inspect($file, $parsed->key, $selector, trim($item->expected));
    }

    /**
     * Minden kijelölt bekezdésnek teljesítenie kell (mindent vagy semmit). A
     * szelektor nélküli pont a dokumentum alapértelmezését (Normál stílus) nézi.
     * A visszahívás null-t ad, ha nincs mit vizsgálni.
     *
     * @param  Closure(ParagraphInfo): ?CheckOutcome  $test
     */
    protected function eachParagraph(DocumentModel $document, ?DocumentSelector $selector, Closure $test): CheckOutcome
    {
        $targets = $selector === null ? [$document->defaults] : $selector->paragraphs($document);
        $first = null;

        foreach ($targets as $paragraph) {
            $outcome = $test($paragraph);

            if ($outcome === null) {
                return CheckOutcome::fail();
            }

            if (! $outcome->passed) {
                return $outcome;
            }

            $first ??= $outcome;
        }

        return $first ?? CheckOutcome::fail();
    }

    /** A diáknak szóló "ezt találtuk" szöveg a lang-fájl `found.<típus>.<kulcs>` sablonjából. */
    protected function found(string $key, string $value): string
    {
        return __('filetasks_document.found.'.$this->type()->value.'.'.$key, ['value' => $value]);
    }

    /** @param  array<string, string>  $replace */
    protected function message(string $key, array $replace = []): string
    {
        $text = __('filetasks_document.'.$key, $replace);

        return is_string($text) ? $text : $key;
    }

    protected function yesNo(bool $value): string
    {
        return __($value ? 'filetasks_document.yes' : 'filetasks_document.no');
    }

    /** Hosszúság milliméterben; mértékegység nélküli szám pontnak számít. */
    protected function lengthMm(string $text): ?float
    {
        $length = Lengths::toMillimetres($text);

        if ($length !== null) {
            return $length;
        }

        $points = Numbers::parse($text);

        return $points === null ? null : $points / 72 * 25.4;
    }

    protected function lengthError(string $expected): ?string
    {
        return $this->lengthMm($expected) === null ? $this->message('error.expected_length') : null;
    }

    protected function booleanError(string $expected): ?string
    {
        return Booleans::parse($expected) === null ? $this->message('error.expected_boolean') : null;
    }

    protected function countError(string $expected): ?string
    {
        return Numbers::parseCount($expected) === null ? $this->message('error.expected_count') : null;
    }
}
