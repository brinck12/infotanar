<?php

declare(strict_types=1);

namespace App\Exceptions\Catalog;

use App\Exceptions\DomainException;

/** A videofeltoltes valamelyik lepese ervenytelen (422, a `file` mezore). */
final class InvalidVideoUpload extends DomainException
{
    private function __construct(string $message)
    {
        parent::__construct($message);
    }

    public static function tooLarge(int $maxMb): self
    {
        return new self(__('catalog.upload_too_large', ['max' => $maxMb]));
    }

    public static function unsupportedType(): self
    {
        return new self(__('catalog.upload_unsupported_type'));
    }

    public static function partOutOfRange(int $part, int $total): self
    {
        return new self(__('catalog.upload_part_out_of_range', ['part' => $part, 'total' => $total]));
    }

    public static function partWrongLength(int $part, int $expected): self
    {
        return new self(__('catalog.upload_part_wrong_length', ['part' => $part, 'expected' => $expected]));
    }

    public static function sizeMismatch(int $declared): self
    {
        return new self(__('catalog.upload_size_mismatch', ['size' => $declared]));
    }

    /** @param list<int> $missing */
    public static function incomplete(array $missing): self
    {
        return new self(__('catalog.upload_incomplete', ['missing' => implode(', ', array_slice($missing, 0, 10))]));
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
