<?php

declare(strict_types=1);

namespace App\Support\RateLimiting;

use App\Models\User;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Config;

/**
 * A kodfuttatas (`/run`, `/submissions`) korlatai (#148).
 *
 * Bejelentkezve a korlat a fiokhoz kotodik, nem az IP-hez: egy iskolai halozat
 * egyetlen kozos IP-cimrol jon, es IP szerint az egesz osztaly osztozna egy
 * kereten. Vendegnel marad az IP, mert mas azonosito nincs.
 *
 * A sorrend szamit: a Laravel sorban ellenorzi es noveli a korlatokat, ezert a
 * kozos (Judge0-t vedo) keret az utolso, hogy az egyeni korlaton elbuko keres
 * ne fogyasszon belole.
 */
final class ExecutionRateLimit
{
    /** @return list<Limit> */
    public function limits(Request $request): array
    {
        $user = $request->user('sanctum');

        $own = $user instanceof User
            ? [
                Limit::perMinute($this->perMinuteFor($user))->by("minute:user:{$user->id}")->response($this->tooMany(guest: false)),
                Limit::perDay(Config::integer('judge0.rate.user_per_day'))->by("day:user:{$user->id}")->response($this->dailyCapReached()),
            ]
            : [
                Limit::perMinute(Config::integer('judge0.rate.guest_per_minute'))->by("minute:ip:{$request->ip()}")->response($this->tooMany(guest: true)),
            ];

        return [
            ...$own,
            Limit::perMinute(Config::integer('judge0.rate.global_per_minute'))->by('global')->response($this->busy()),
        ];
    }

    private function perMinuteFor(User $user): int
    {
        return $user->isAdmin() || $user->hasPremiumAccess()
            ? Config::integer('judge0.rate.premium_per_minute')
            : Config::integer('judge0.rate.user_per_minute');
    }

    /**
     * A `retry_after` a torzsben is benne van: a kliens ebbol szamol vissza, es nem fugg
     * attol, hogy a bongeszo latja-e a Retry-After fejlecet (CORS).
     *
     * @return callable(Request, array<array-key, mixed>): JsonResponse
     */
    private function tooMany(bool $guest): callable
    {
        return static fn (Request $request, array $headers): JsonResponse => self::respond(429, 'rate_limited', $headers, [
            // A vendegnek jelezzuk, hogy bejelentkezve tobbet futtathat.
            'guest' => $guest,
        ]);
    }

    /** @return callable(Request, array<array-key, mixed>): JsonResponse */
    private function dailyCapReached(): callable
    {
        return static fn (Request $request, array $headers): JsonResponse => self::respond(429, 'daily_limit', $headers);
    }

    /**
     * Nem a kero hibaja: a futtato kapacitasa fogyott el, ezert 503, nem 429.
     *
     * @return callable(Request, array<array-key, mixed>): JsonResponse
     */
    private function busy(): callable
    {
        return static fn (Request $request, array $headers): JsonResponse => self::respond(503, 'busy', $headers);
    }

    /**
     * @param  array<array-key, mixed>  $headers  a Laravel altal szamolt fejlecek (Retry-After, X-RateLimit-*)
     * @param  array<string, mixed>  $extra
     */
    private static function respond(int $status, string $reason, array $headers, array $extra = []): JsonResponse
    {
        $retryAfter = is_numeric($headers['Retry-After'] ?? null) ? (int) $headers['Retry-After'] : 60;

        return response()->json([
            'message' => __("execution.{$reason}", ['seconds' => $retryAfter]),
            'reason' => $reason,
            'retry_after' => $retryAfter,
            ...$extra,
        ], $status, $headers);
    }
}
