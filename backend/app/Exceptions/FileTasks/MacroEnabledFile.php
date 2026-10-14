<?php

declare(strict_types=1);

namespace App\Exceptions\FileTasks;

use App\Exceptions\DomainException;

/**
 * Makrot tartalmazo (vagy makros kiterjesztesu) fajl: soha nem fogadjuk el,
 * akkor sem, ha a feladat felsorolna a kiterjesztest.
 */
final class MacroEnabledFile extends DomainException
{
    public function __construct()
    {
        parent::__construct(__('filetasks.macro_enabled'));
    }

    public function status(): int
    {
        return 422;
    }

    public function errors(): array
    {
        return ['file' => [$this->getMessage()]];
    }
}
