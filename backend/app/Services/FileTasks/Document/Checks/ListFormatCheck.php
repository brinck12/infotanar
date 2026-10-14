<?php

declare(strict_types=1);

namespace App\Services\FileTasks\Document\Checks;

use App\Enums\RubricCheckType;
use App\Services\FileTasks\CheckOutcome;
use App\Services\FileTasks\Document\DocumentModel;
use App\Services\FileTasks\Document\DocumentSelector;
use App\Services\FileTasks\Document\DocxParser;
use App\Services\FileTasks\Document\ParagraphInfo;
use App\Services\FileTasks\Document\Words;
use App\Services\FileTasks\Grammar\Text;

/**
 * Felsorolás és számozás: típus (bullet|number), szint (1-től) és jel. A
 * kijelölt bekezdésnek listaelemnek kell lennie, különben nincs mit vizsgálni.
 */
final class ListFormatCheck extends AbstractDocumentCheck
{
    public function type(): RubricCheckType
    {
        return RubricCheckType::ListFormat;
    }

    protected function properties(): array
    {
        return array_fill_keys(['type', 'level', 'symbol'], self::PARAGRAPH_SELECTORS);
    }

    protected function expectedError(string $key, string $expected, ?DocumentSelector $selector): ?string
    {
        return match ($key) {
            'type' => Words::listType($expected) === null ? $this->message('error.expected_list_type') : null,
            'level' => $this->countError($expected) ?? ((int) $expected < 1 ? $this->message('error.expected_count') : null),
            default => $expected === '' ? $this->message('error.expected_text') : null,
        };
    }

    protected function inspect(DocumentModel $document, string $key, ?DocumentSelector $selector, string $expected): CheckOutcome
    {
        return $this->eachParagraph($document, $selector, function (ParagraphInfo $paragraph) use ($key, $expected): ?CheckOutcome {
            $list = $paragraph->list;

            if ($list === null) {
                return null;
            }

            return match ($key) {
                'type' => new CheckOutcome(Words::listType($expected) === $list->type, $this->found($key, Words::label('list_type', $list->type))),
                'level' => new CheckOutcome($list->level === (int) $expected, $this->found($key, (string) $list->level)),
                default => new CheckOutcome(
                    Text::equals($list->symbol, DocxParser::normalizeBullet($expected)),
                    $this->found($key, $list->symbol),
                ),
            };
        });
    }
}
