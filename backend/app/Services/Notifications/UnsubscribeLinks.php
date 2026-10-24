<?php

declare(strict_types=1);

namespace App\Services\Notifications;

use App\Models\User;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\URL;

/**
 * A heti osszefoglalo leiratkozo linkjei. Az alairas nem jar le: egy regi level linkje is mukodik.
 * Relativ alairas (mint a megerosito levelnel), mert a backend host proxy mogott elterhet.
 */
final class UnsubscribeLinks
{
    private const ROUTE = 'api.notifications.weekly-summary.unsubscribe';

    /**
     * @return array{frontend: string, api: string} a frontend leiratkozo oldala, es a háttér
     *                                              alairt POST cime (a `List-Unsubscribe` fejlechez)
     */
    public static function for(User $user): array
    {
        $signed = URL::signedRoute(self::ROUTE, ['id' => $user->getKey()], absolute: false);

        return [
            'frontend' => Config::string('app.frontend_url').'/leiratkozas?'
                .http_build_query(['id' => $user->getKey()]).'&'.parse_url($signed, PHP_URL_QUERY),
            'api' => rtrim(Config::string('app.url'), '/').$signed,
        ];
    }
}
