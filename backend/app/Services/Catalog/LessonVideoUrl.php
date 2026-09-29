<?php

declare(strict_types=1);

namespace App\Services\Catalog;

use Carbon\CarbonImmutable;

final readonly class LessonVideoUrl
{
    public function __construct(
        public string $url,
        public CarbonImmutable $expiresAt,
    ) {}
}
