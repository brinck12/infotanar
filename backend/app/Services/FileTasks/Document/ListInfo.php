<?php

declare(strict_types=1);

namespace App\Services\FileTasks\Document;

/** Egy listaelem: típus (bullet|number), szint (1-től) és jel (felsorolásnál a jelkarakter). */
final readonly class ListInfo
{
    public function __construct(
        public string $type,
        public int $level,
        public string $symbol,
    ) {}
}
