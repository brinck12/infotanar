<?php

declare(strict_types=1);

namespace App\Services\FileTasks\Document;

/** Egy szövegrész (futás) szövege és a stílusokkal feloldott karakterformázása. */
final readonly class RunInfo
{
    public function __construct(
        public string $text,
        public Props $props,
    ) {}
}
