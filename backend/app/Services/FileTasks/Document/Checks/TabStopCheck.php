<?php

declare(strict_types=1);

namespace App\Services\FileTasks\Document\Checks;

use App\Enums\RubricCheckType;
use App\Services\FileTasks\CheckOutcome;
use App\Services\FileTasks\Document\DocumentModel;
use App\Services\FileTasks\Document\DocumentSelector;
use App\Services\FileTasks\Document\ParagraphInfo;
use App\Services\FileTasks\Document\TabStop;
use App\Services\FileTasks\Document\Words;
use App\Services\FileTasks\Grammar\Lengths;

/**
 * Tabulátorállók: pozíció, típus, kitöltés. Teljesül, ha a kijelölt bekezdésnek
 * van az elvárt értékű tabulátorállója (a stílusból örököltekkel együtt).
 */
final class TabStopCheck extends AbstractDocumentCheck
{
    public function type(): RubricCheckType
    {
        return RubricCheckType::TabStop;
    }

    protected function properties(): array
    {
        return array_fill_keys(['position', 'type', 'leader'], self::PARAGRAPH_SELECTORS);
    }

    protected function expectedError(string $key, string $expected, ?DocumentSelector $selector): ?string
    {
        return match ($key) {
            'position' => Lengths::toMillimetres($expected) === null ? $this->message('error.expected_length') : null,
            'type' => Words::tabType($expected) === null ? $this->message('error.expected_tab_type') : null,
            default => Words::leader($expected) === null ? $this->message('error.expected_leader') : null,
        };
    }

    protected function inspect(DocumentModel $document, string $key, ?DocumentSelector $selector, string $expected): CheckOutcome
    {
        return $this->eachParagraph($document, $selector, fn (ParagraphInfo $paragraph): ?CheckOutcome => $this->test($paragraph->props->tabs(), $key, $expected));
    }

    /** @param  list<TabStop>  $tabs */
    private function test(array $tabs, string $key, string $expected): ?CheckOutcome
    {
        if ($tabs === []) {
            return null;
        }

        $display = implode(', ', array_map(fn (TabStop $tab): string => match ($key) {
            'position' => Lengths::format($tab->positionMm),
            'type' => Words::label('tab_type', $tab->type),
            default => Words::label('leader', $tab->leader),
        }, $tabs));

        foreach ($tabs as $tab) {
            $matches = match ($key) {
                'position' => ($wanted = Lengths::toMillimetres($expected)) !== null && Lengths::close($tab->positionMm, $wanted),
                'type' => Words::tabType($expected) === $tab->type,
                default => Words::leader($expected) === $tab->leader,
            };

            if ($matches) {
                return CheckOutcome::pass($this->found($key, $display));
            }
        }

        return CheckOutcome::fail($this->found($key, $display));
    }
}
