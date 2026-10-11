<?php

declare(strict_types=1);

namespace App\Services\FileTasks\Presentation;

/**
 * A `lang/hu/filetasks_presentation.php` szovegei, mindig szovegkent (a
 * `__()` tipusa tomb is lehet, ami a `?string` visszateresekkel nem fer ossze).
 */
final class Message
{
    /**
     * @param  array<string, scalar|null>  $replace
     */
    public static function get(string $key, array $replace = []): string
    {
        return __('filetasks_presentation.'.$key, $replace);
    }
}
