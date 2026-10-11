<?php

declare(strict_types=1);

namespace App\Services\FileTasks\Document;

/** Egy bekezdés a feloldott formázással (a táblázatcellákban lévők is). */
final readonly class ParagraphInfo
{
    /** @param  non-empty-list<RunInfo>  $runs mindig legalább egy elem: üres bekezdésnél a bekezdés alapformázása */
    public function __construct(
        public string $text,
        public ?string $styleId,
        public string $styleName,
        /** Címsor szintje (1-től), vagy null, ha nem címsor. */
        public ?int $headingLevel,
        /** A bekezdés teljes (stílusokból feloldott) formázása, a karakterformázás alapjával együtt. */
        public Props $props,
        public array $runs,
        public ?ListInfo $list,
    ) {}
}
