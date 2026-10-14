<?php

declare(strict_types=1);

namespace App\Exceptions\Catalog;

use App\Exceptions\DomainException;

/**
 * Egy feladathoz (vagy tesztesethez) nem csatolhato tobb fajl az adott
 * szerepben. A ManageAttachment dobja, a tulajdonos soranak zarolasa alatt.
 */
final class AttachmentLimitReached extends DomainException
{
    public function __construct(int $max)
    {
        parent::__construct(__('filetasks.attachment_limit_reached', ['max' => $max]));
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
