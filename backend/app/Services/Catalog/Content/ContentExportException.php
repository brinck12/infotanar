<?php

declare(strict_types=1);

namespace App\Services\Catalog\Content;

use RuntimeException;

/** Az export nem hajtható végre (meglévő fájlok `--force` nélkül, vagy veszteségmentesen nem kiírható érték). */
final class ContentExportException extends RuntimeException
{
    /**
     * @param  list<string>  $files  az érintett fájlok relatív útvonala
     */
    public function __construct(string $message, public readonly array $files = [])
    {
        parent::__construct($message);
    }
}
