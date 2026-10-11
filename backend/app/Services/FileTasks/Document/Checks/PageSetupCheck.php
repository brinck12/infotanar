<?php

declare(strict_types=1);

namespace App\Services\FileTasks\Document\Checks;

use App\Enums\RubricCheckType;
use App\Services\FileTasks\CheckOutcome;
use App\Services\FileTasks\Document\DocumentModel;
use App\Services\FileTasks\Document\DocumentSelector;
use App\Services\FileTasks\Document\PageSizes;
use App\Services\FileTasks\Document\Words;
use App\Services\FileTasks\Grammar\Lengths;

/** Oldalbeállítás az első szakaszban: lapméret, tájolás, margók. */
final class PageSetupCheck extends AbstractDocumentCheck
{
    public function type(): RubricCheckType
    {
        return RubricCheckType::PageSetup;
    }

    protected function properties(): array
    {
        return ['page_size' => [], 'orientation' => [], 'margin_top' => [], 'margin_bottom' => [], 'margin_left' => [], 'margin_right' => []];
    }

    protected function expectedError(string $key, string $expected, ?DocumentSelector $selector): ?string
    {
        return match (true) {
            $key === 'page_size' => PageSizes::isKnownName($expected) ? null : $this->message('error.expected_page_size'),
            $key === 'orientation' => Words::orientation($expected) === null ? $this->message('error.expected_orientation') : null,
            default => $this->lengthError($expected),
        };
    }

    protected function inspect(DocumentModel $document, string $key, ?DocumentSelector $selector, string $expected): CheckOutcome
    {
        $section = $document->firstSection();

        if ($key === 'page_size' || $key === 'orientation') {
            if ($section->widthMm === null || $section->heightMm === null) {
                return CheckOutcome::fail();
            }

            if ($key === 'page_size') {
                return new CheckOutcome(
                    PageSizes::isNamed($section->widthMm, $section->heightMm, $expected),
                    $this->found($key, DocumentModel::sizeLabel($section)),
                );
            }

            $landscape = $section->widthMm > $section->heightMm;

            return new CheckOutcome(
                Words::orientation($expected) === ($landscape ? 'landscape' : 'portrait'),
                $this->found($key, Words::label('orientation', $landscape ? 'landscape' : 'portrait')),
            );
        }

        $found = match ($key) {
            'margin_top' => $section->marginTopMm,
            'margin_bottom' => $section->marginBottomMm,
            'margin_left' => $section->marginLeftMm,
            default => $section->marginRightMm,
        };
        $wanted = $this->lengthMm($expected);

        if ($found === null || $wanted === null) {
            return CheckOutcome::fail();
        }

        return new CheckOutcome(Lengths::close($found, $wanted), $this->found($key, Lengths::format($found)));
    }
}
