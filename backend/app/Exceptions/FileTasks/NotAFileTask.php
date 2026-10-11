<?php

declare(strict_types=1);

namespace App\Exceptions\FileTasks;

use App\Exceptions\DomainException;

/**
 * Fajlt csak feltoltos fajtaju feladathoz lehet beadni (sheet_upload,
 * doc_upload, visual_upload); a szerkesztos feladat a /run es a /submissions
 * vegponton megy.
 */
final class NotAFileTask extends DomainException
{
    public function __construct()
    {
        parent::__construct(__('filetasks.not_a_file_task'));
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
