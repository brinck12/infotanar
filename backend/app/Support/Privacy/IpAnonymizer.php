<?php

declare(strict_types=1);

namespace App\Support\Privacy;

/** IP-cim csonkolasa tarolas elott: IPv4 /24, IPv6 /48 (PRIV-4). */
final class IpAnonymizer
{
    public static function truncate(?string $ip): ?string
    {
        if ($ip === null || $ip === '') {
            return null;
        }

        $packed = inet_pton($ip);

        if ($packed === false) {
            return null;
        }

        $keep = strlen($packed) === 4 ? 3 : 6;
        $masked = substr($packed, 0, $keep).str_repeat("\0", strlen($packed) - $keep);

        $text = inet_ntop($masked);

        return $text === false ? null : $text;
    }
}
