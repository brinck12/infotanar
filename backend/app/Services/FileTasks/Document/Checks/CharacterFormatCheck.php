<?php

declare(strict_types=1);

namespace App\Services\FileTasks\Document\Checks;

use App\Enums\RubricCheckType;
use App\Services\FileTasks\CheckOutcome;
use App\Services\FileTasks\Document\DocumentModel;
use App\Services\FileTasks\Document\DocumentSelector;
use App\Services\FileTasks\Document\ParagraphInfo;
use App\Services\FileTasks\Document\Props;
use App\Services\FileTasks\Grammar\Booleans;
use App\Services\FileTasks\Grammar\Colors;
use App\Services\FileTasks\Grammar\Numbers;
use App\Services\FileTasks\Grammar\Text;

/**
 * Karakterformázás: betűtípus, méret, félkövér, dőlt, aláhúzott, kiskapitális,
 * felső/alsó index, szín. A tényleges érték (stílusokkal feloldva) számít; a
 * kijelölt bekezdés minden nem üres szövegrészének teljesítenie kell.
 */
final class CharacterFormatCheck extends AbstractDocumentCheck
{
    /** Logikai tulajdonságok: kulcs => a Props kulcsa. */
    private const FLAGS = [
        'bold' => 'bold', 'italic' => 'italic', 'underline' => 'underline', 'small_caps' => 'small_caps',
        'superscript' => 'superscript', 'subscript' => 'subscript',
    ];

    public function type(): RubricCheckType
    {
        return RubricCheckType::CharacterFormat;
    }

    protected function properties(): array
    {
        $keys = ['font', 'font_size', 'color', ...array_keys(self::FLAGS)];

        return array_fill_keys($keys, self::PARAGRAPH_SELECTORS);
    }

    protected function expectedError(string $key, string $expected, ?DocumentSelector $selector): ?string
    {
        return match (true) {
            $key === 'font' => $expected === '' ? $this->message('error.expected_text') : null,
            $key === 'font_size' => $this->size($expected) === null ? $this->message('error.expected_size') : null,
            $key === 'color' => Colors::parse($expected) === null ? $this->message('error.expected_color') : null,
            default => $this->booleanError($expected),
        };
    }

    protected function inspect(DocumentModel $document, string $key, ?DocumentSelector $selector, string $expected): CheckOutcome
    {
        return $this->eachParagraph($document, $selector, function (ParagraphInfo $paragraph) use ($key, $expected): ?CheckOutcome {
            $first = null;

            foreach ($paragraph->runs as $run) {
                $outcome = $this->test($run->props, $key, $expected);

                if ($outcome === null || ! $outcome->passed) {
                    return $outcome;
                }

                $first ??= $outcome;
            }

            return $first;
        });
    }

    private function test(Props $props, string $key, string $expected): ?CheckOutcome
    {
        if ($key === 'font') {
            $font = $props->string('font');

            return $font === null ? null : new CheckOutcome(Text::equals($font, $expected), $this->found($key, $font));
        }

        if ($key === 'font_size') {
            $size = $props->float('size_pt');
            $wanted = $this->size($expected);

            return $size === null || $wanted === null
                ? null
                : new CheckOutcome(Numbers::close($size, $wanted), $this->found($key, Numbers::format($size)));
        }

        if ($key === 'color') {
            $color = $props->string('color') ?? '000000';
            $wanted = Colors::parse($expected);

            return $wanted === null ? null : new CheckOutcome(Colors::close($color, $wanted), $this->found($key, Colors::format($color)));
        }

        $flag = $props->bool(self::FLAGS[$key] ?? $key) ?? false;

        return new CheckOutcome($flag === Booleans::parse($expected), $this->found($key, $this->yesNo($flag)));
    }

    /** Betűméret pontban: "12", "12 pt", "10,5". */
    private function size(string $text): ?float
    {
        $size = Numbers::parse((string) preg_replace('/\s*pt$/i', '', $text));

        return $size !== null && $size > 0 ? $size : null;
    }
}
