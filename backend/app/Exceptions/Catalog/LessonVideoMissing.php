<?php

declare(strict_types=1);

namespace App\Exceptions\Catalog;

use App\Exceptions\DomainException;

final class LessonVideoMissing extends DomainException
{
    public function __construct()
    {
        parent::__construct(__('catalog.video_missing'));
    }

    public function status(): int
    {
        return 404;
    }
}
