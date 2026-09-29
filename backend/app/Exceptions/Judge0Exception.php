<?php

declare(strict_types=1);

namespace App\Exceptions;

use RuntimeException;
use Throwable;

/**
 * A kodfuttato szolgaltatas elerhetetlen vagy hibas valaszt adott.
 *
 * Az uzenet valtozatlanul a felhasznalohoz kerul, ezert csak a nevesitett
 * konstruktorokkal jon letre, amelyek kizarolag rogzitett, magyar szoveget
 * adnak: soha nem kerulhet bele a Judge0 URL, token vagy nyers hibaszoveg.
 * A technikai reszletek a `previous` kivetelben maradnak (naplozashoz).
 */
final class Judge0Exception extends RuntimeException
{
    private function __construct(string $message, ?Throwable $previous = null)
    {
        parent::__construct($message, 0, $previous);
    }

    public static function unreachable(Throwable $previous): self
    {
        return new self(__('execution.judge0.unreachable'), $previous);
    }

    public static function httpError(int $status): self
    {
        return new self(__('execution.judge0.http_error', ['status' => $status]));
    }

    public static function malformedResponse(): self
    {
        return new self(__('execution.judge0.malformed_response'));
    }

    public static function unsupportedLanguage(string $language): self
    {
        return new self(__('execution.unsupported_language', ['language' => $language]));
    }
}
