<?php

declare(strict_types=1);

namespace App\Exceptions\Catalog;

use App\Exceptions\DomainException;

/**
 * Torles megtagadva, mert diak-adatot (beadas, teljesites) vagy gyerek-elemet
 * vinne magaval. Visszafordithatatlan adatvesztes helyett: rejtsd el
 * (is_published = false).
 */
final class CatalogItemInUse extends DomainException
{
    public static function hasChildren(): self
    {
        return new self(__('catalog.delete_has_children'));
    }

    public static function hasStudentData(): self
    {
        return new self(__('catalog.delete_has_student_data'));
    }

    public function status(): int
    {
        return 409;
    }
}
