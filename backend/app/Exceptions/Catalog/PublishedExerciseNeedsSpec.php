<?php

declare(strict_types=1);

namespace App\Exceptions\Catalog;

use App\Exceptions\DomainException;

/**
 * Publikalt, nem szerkesztos feladatnak ki kell toltenie a fajtaja adatait
 * (`spec`): fajlfeladatnal a beadando fajl leirasat, bongeszos feladatnal
 * legalabb egy ellenorzest. Enelkul a diak ures munkateruletet kapna.
 */
final class PublishedExerciseNeedsSpec extends DomainException
{
    public function __construct()
    {
        parent::__construct(__('catalog.needs_spec'));
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
