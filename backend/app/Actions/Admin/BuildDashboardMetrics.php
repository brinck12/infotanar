<?php

declare(strict_types=1);

namespace App\Actions\Admin;

use App\Enums\DashboardRange;
use App\Services\Admin\Metrics\AttentionList;
use App\Services\Admin\Metrics\LearningMetrics;
use App\Services\Admin\Metrics\LocalDayRange;
use App\Services\Admin\Metrics\RevenueMetrics;
use App\Services\Admin\Metrics\SubscriptionMetrics;
use App\Services\Admin\Metrics\UserMetrics;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Config;

/**
 * Az admin attekintes mutatoi (#160): elofizetesek, bevetel, felhasznalok, tanulas, figyelmet
 * kero dolgok, az idoszak es az elozo, ugyanilyen hosszu idoszak osszehasonlitasaval.
 *
 * Minden szam SQL-aggregacio (felhasznalonkenti lekerdezes nincs), a lekerdezesek szama az
 * adatmennyisegtol fuggetlen. Az eredmeny idoszakonkent rovid ideig gyorsitotarazott, ezert egy
 * megnyitott attekintes frissitgetese nem terheli az adatbazist.
 */
final readonly class BuildDashboardMetrics
{
    public function __construct(
        private SubscriptionMetrics $subscriptions,
        private RevenueMetrics $revenue,
        private UserMetrics $users,
        private LearningMetrics $learning,
        private AttentionList $attention,
    ) {}

    /** @return array<string, mixed> */
    public function handle(DashboardRange $range): array
    {
        return Cache::remember(
            'admin.dashboard.'.$range->value,
            Config::integer('dashboard.cache_ttl'),
            fn (): array => $this->build($range),
        );
    }

    /** @return array<string, mixed> */
    private function build(DashboardRange $range): array
    {
        $timezone = Config::string('dashboard.timezone');
        $now = CarbonImmutable::now();
        $current = LocalDayRange::lastDays($now, $range->days(), $timezone);
        $previous = $current->previous($timezone);

        return [
            'range' => [
                'key' => $range->value,
                'days' => $current->days,
                'timezone' => $timezone,
                'generated_at' => $now->toIso8601String(),
            ],
            'subscriptions' => $this->subscriptions->collect($current, $previous),
            'revenue' => $this->revenue->collect($current, $previous),
            'users' => $this->users->collect($current, $previous),
            'learning' => $this->learning->collect($current, $previous),
            'attention' => $this->attention->collect($now),
        ];
    }
}
