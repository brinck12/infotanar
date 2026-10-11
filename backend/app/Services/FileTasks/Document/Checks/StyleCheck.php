<?php

declare(strict_types=1);

namespace App\Services\FileTasks\Document\Checks;

use App\Enums\RubricCheckType;
use App\Services\FileTasks\CheckOutcome;
use App\Services\FileTasks\Document\DocumentModel;
use App\Services\FileTasks\Document\DocumentSelector;
use App\Services\FileTasks\Document\StyleResolver;
use App\Services\FileTasks\Grammar\Booleans;

/**
 * Stílusok: `exists[style=NÉV]` (a stílus létezik a dokumentumban) és
 * `applied` (a stílust használja valamelyik bekezdés, vagy a kijelölt bekezdés
 * a megadott nevű stílusú). A "Címsor 1" és a "Heading 1" ugyanaz a stílus.
 */
final class StyleCheck extends AbstractDocumentCheck
{
    public function type(): RubricCheckType
    {
        return RubricCheckType::Style;
    }

    protected function properties(): array
    {
        return [
            'exists' => ['style'],
            'applied' => self::PARAGRAPH_SELECTORS,
        ];
    }

    protected function requiresSelector(string $key): bool
    {
        return true;
    }

    protected function expectedError(string $key, string $expected, ?DocumentSelector $selector): ?string
    {
        if ($key === 'exists' || $selector?->kind === 'style') {
            return $this->booleanError($expected);
        }

        return $expected === '' ? $this->message('error.expected_style') : null;
    }

    protected function inspect(DocumentModel $document, string $key, ?DocumentSelector $selector, string $expected): CheckOutcome
    {
        if ($selector === null) {
            return CheckOutcome::fail();
        }

        if ($key === 'exists') {
            $exists = $document->styles->findByName($selector->value) !== null
                || $this->listed($document, $selector->value);

            return new CheckOutcome(
                $exists === Booleans::parse($expected),
                $this->found('exists', $this->yesNo($exists)),
            );
        }

        if ($selector->kind === 'style') {
            $applied = $selector->paragraphs($document) !== [];

            return new CheckOutcome($applied === Booleans::parse($expected), $this->found('applied', $this->yesNo($applied)));
        }

        $paragraph = $selector->paragraphs($document)[0] ?? null;

        if ($paragraph === null) {
            return CheckOutcome::fail();
        }

        $name = $paragraph->styleName;

        return new CheckOutcome($selector->usesStyle($paragraph, $expected), $this->found('applied_name', $name));
    }

    private function listed(DocumentModel $document, string $name): bool
    {
        $wanted = StyleResolver::nameKey($name);

        foreach ($document->definedStyleNames as $defined) {
            if (StyleResolver::nameKey($defined) === $wanted) {
                return true;
            }
        }

        return false;
    }
}
