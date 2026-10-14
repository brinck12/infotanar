<?php

declare(strict_types=1);

namespace App\Services\FileTasks\Document\Checks;

use App\Enums\RubricCheckType;
use App\Services\FileTasks\CheckOutcome;
use App\Services\FileTasks\Document\DocumentModel;
use App\Services\FileTasks\Document\DocumentSelector;
use App\Services\FileTasks\Document\Words;
use App\Services\FileTasks\Grammar\Booleans;

/**
 * Szakaszok: oszlopszám, a szakasz kezdete (`break_before`) és a lap tájolása.
 * Szelektor nélkül az első szakaszt nézi (`[section=N]`: az N-edik).
 */
final class SectionCheck extends AbstractDocumentCheck
{
    public function type(): RubricCheckType
    {
        return RubricCheckType::Section;
    }

    protected function properties(): array
    {
        return array_fill_keys(['columns', 'break_before', 'page_orientation'], ['section']);
    }

    protected function expectedError(string $key, string $expected, ?DocumentSelector $selector): ?string
    {
        return match ($key) {
            'columns' => $this->countError($expected),
            'break_before' => Booleans::parse($expected) === null && Words::sectionBreak($expected) === null
                ? $this->message('error.expected_break')
                : null,
            default => Words::orientation($expected) === null ? $this->message('error.expected_orientation') : null,
        };
    }

    protected function inspect(DocumentModel $document, string $key, ?DocumentSelector $selector, string $expected): CheckOutcome
    {
        $section = $document->sections[($selector->index ?? 1) - 1] ?? null;

        if ($section === null) {
            return CheckOutcome::fail();
        }

        if ($key === 'columns') {
            return new CheckOutcome($section->columns === (int) $expected, $this->found($key, (string) $section->columns));
        }

        if ($key === 'break_before') {
            $wantedBool = Booleans::parse($expected);
            $newPage = $section->breakType !== 'continuous';
            $passed = $wantedBool !== null ? $newPage === $wantedBool : Words::sectionBreak($expected) === $section->breakType;

            return new CheckOutcome($passed, $this->found($key, Words::label('break', $section->breakType)));
        }

        $landscape = $section->isLandscape();

        if ($landscape === null) {
            return CheckOutcome::fail();
        }

        return new CheckOutcome(
            Words::orientation($expected) === ($landscape ? 'landscape' : 'portrait'),
            $this->found($key, Words::label('orientation', $landscape ? 'landscape' : 'portrait')),
        );
    }
}
