<?php

declare(strict_types=1);

namespace App\Exceptions\Catalog;

use App\Exceptions\DomainException;

/**
 * Ures lecke nem publikalhato: se letezo video, se jegyzet, se feladat.
 * A diak enelkul ures oldalt kapna.
 */
final class LessonNotPublishable extends DomainException
{
    public static function empty(): self
    {
        return new self(__('catalog.lesson_empty'));
    }

    public function status(): int
    {
        return 422;
    }

    public function errors(): array
    {
        return ['is_published' => [$this->getMessage()]];
    }
}
