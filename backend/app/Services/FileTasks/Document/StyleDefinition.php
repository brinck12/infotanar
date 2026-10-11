<?php

declare(strict_types=1);

namespace App\Services\FileTasks\Document;

/** Egy nevesitett stilus a stiluslapon (docx `w:style`, odt `style:style`). */
final readonly class StyleDefinition
{
    public const PARAGRAPH = 'paragraph';

    public const CHARACTER = 'character';

    public const OTHER = 'other';

    public function __construct(
        /** A fajlban hasznalt azonosito (docx styleId, odt style:name). */
        public string $id,
        /** A felhasznalonak mutatott nev ("Címsor 1"). */
        public string $name,
        /** paragraph | character | other */
        public string $family,
        public ?string $basedOn,
        public Props $props,
    ) {}
}
