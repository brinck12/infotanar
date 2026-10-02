<?php

declare(strict_types=1);

namespace App\Exceptions\Catalog;

use App\Exceptions\DomainException;

/** A feltoltott felirat nem WebVTT (nem "WEBVTT"-vel kezdodik). */
final class InvalidCaptionsFile extends DomainException
{
    public function __construct()
    {
        parent::__construct(__('catalog.captions_invalid'));
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
