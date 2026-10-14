<?php

declare(strict_types=1);

namespace App\Services\FileTasks\Presentation;

use DOMDocument;
use DOMElement;

/**
 * Egy pptx minta (slideMaster) es temaja: szinek, betutipusok, a hatterstilusok
 * es a szinleképezés. A PptxParser egyszer epiti fel masterenkent.
 */
final readonly class PptxMaster
{
    /**
     * @param  array<string, string>  $colors  tema szinnev => RRGGBB
     * @param  array<string, string>  $clrMap  szinleképezés (bg1 => lt1...)
     * @param  list<DOMElement>  $backgroundStyles  a tema hatter-kitoltesi stilusai
     */
    public function __construct(
        public DOMDocument $document,
        public Xp $xp,
        public array $colors,
        public array $clrMap,
        public ?string $majorFont,
        public ?string $minorFont,
        public array $backgroundStyles,
    ) {}
}
