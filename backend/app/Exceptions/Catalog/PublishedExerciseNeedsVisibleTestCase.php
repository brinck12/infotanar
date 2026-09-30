<?php

declare(strict_types=1);

namespace App\Exceptions\Catalog;

use App\Exceptions\DomainException;

/**
 * Publikalt feladatnak legalabb egy nyilvanos tesztesete kell: enelkul a
 * "Futtatas" gomb nem mukodik (a /run csak a nyilvanos teszteseteken fut).
 */
final class PublishedExerciseNeedsVisibleTestCase extends DomainException
{
    public function __construct()
    {
        parent::__construct(__('catalog.needs_visible_test_case'));
    }

    public function status(): int
    {
        return 422;
    }

    public function errors(): array
    {
        return ['is_hidden' => [$this->getMessage()]];
    }
}
