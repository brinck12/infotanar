<?php

declare(strict_types=1);

namespace App\Exceptions\FileTasks;

use App\Exceptions\DomainException;

/** A feltoltott fajl nagyobb a kategoriajara (vagy a szerepere) ervenyes korlatnal. */
final class UploadTooLarge extends DomainException
{
    private const MEGABYTE = 1024 * 1024;

    public function __construct(int $sizeBytes, int $maxBytes)
    {
        // 1 MB alatti korlatnal (pl. 256 KB) ket tizedes kell, kulonben mindket szam "0,3" lenne.
        $decimals = $maxBytes < self::MEGABYTE ? 2 : 1;

        parent::__construct(__('filetasks.too_large', [
            // A meret felfele, a korlat lefele kerekitve: a kiirt meret mindig nagyobb a kiirt korlatnal.
            'size' => self::megabytes($sizeBytes, $decimals, roundUp: true),
            'max' => self::megabytes($maxBytes, $decimals, roundUp: false),
        ]));
    }

    public function status(): int
    {
        return 422;
    }

    public function errors(): array
    {
        return ['file' => [$this->getMessage()]];
    }

    /** Magyar tizedesvesszovel, folosleges nullak nelkul ("10", "0,25", "12,5"). */
    private static function megabytes(int $bytes, int $decimals, bool $roundUp): string
    {
        $scale = 10 ** $decimals;
        $scaled = $bytes / self::MEGABYTE * $scale;
        $value = ($roundUp ? ceil($scaled) : floor($scaled)) / $scale;

        $formatted = number_format($value, $decimals, ',', ' ');

        return str_contains($formatted, ',') ? rtrim(rtrim($formatted, '0'), ',') : $formatted;
    }
}
