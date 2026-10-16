<?php

declare(strict_types=1);

namespace App\Support\RateLimiting;

/** A Retry-After masodpercekbol emberi varakozasi idot formaz ("30 masodperc", "2 perc"). */
final class WaitTime
{
    public static function label(int $seconds): string
    {
        $seconds = max(1, $seconds);

        return $seconds < 60
            ? __('http.wait.seconds', ['count' => $seconds])
            : __('http.wait.minutes', ['count' => (int) ceil($seconds / 60)]);
    }

    /** A 429-es valasz uzenete az idotartammal; a Retry-After fejlec hianyaban az altalanos szoveg. */
    public static function message(string $baseKey, mixed $retryAfter): string
    {
        if (! is_numeric($retryAfter)) {
            return __($baseKey);
        }

        return __('http.throttled_wait', ['time' => self::label((int) $retryAfter)]);
    }
}
