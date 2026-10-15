<?php

declare(strict_types=1);

namespace App\Support\Alerts;

use Illuminate\Support\Str;

/** A bongeszobol erkezo hibajelentes mezoinek tisztitasa a naplozas elott. */
final class ClientErrorSanitizer
{
    public const MESSAGE_LENGTH = 300;

    public const STACK_LENGTH = 2000;

    public const URL_LENGTH = 300;

    /** Lekerdezes (?...) es toredek (#...) nelkul: azokban token vagy szemelyes adat lehet. */
    public static function url(string $url): string
    {
        $cut = strcspn($url, '?#');

        return Str::limit(substr($url, 0, $cut), self::URL_LENGTH, '');
    }

    public static function message(string $message): string
    {
        return Str::limit($message, self::MESSAGE_LENGTH, '...');
    }

    public static function stack(mixed $stack): ?string
    {
        return is_string($stack) ? Str::limit($stack, self::STACK_LENGTH, '...') : null;
    }
}
