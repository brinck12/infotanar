<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Actions\Progress\BuildWeeklySummary;
use App\Jobs\Concerns\AlertsOperatorOnFailure;
use App\Models\User;
use App\Notifications\WeeklySummaryNotification;
use Carbon\CarbonImmutable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Config;

/**
 * Heti, unnepelo hangu osszefoglalo e-mail (vasarnap este). Csak annak megy, aki kerte
 * (opt-in), megerositett cime van, es azon a heten tanult: aki nem tanult, nem kap levelet,
 * igy a lemarado kevesebb levelet kap, nem tobbet. Hetente legfeljebb egy level megy:
 * a kuldest egyetlen feltetel nelkuli-biztos UPDATE foglalja le, igy ketszeri futas is egy levelet ad.
 */
final class SendWeeklySummaries implements ShouldBeUnique, ShouldQueue
{
    use AlertsOperatorOnFailure, Queueable;

    /** A ket heti kuldes kozott legalabb ennyi nap telik el (a vasarnapi idopont elcsuszasat is elbirja). */
    private const MIN_DAYS_BETWEEN = 6;

    public function handle(BuildWeeklySummary $build): void
    {
        $weekStart = CarbonImmutable::now(Config::string('learning.timezone'))->startOfWeek()->startOfDay();

        $this->due()->chunkById(200, function (Collection $users) use ($build, $weekStart): void {
            foreach ($users as $user) {
                $summary = $build->handle($user, $weekStart);

                if ($summary === null) {
                    continue;
                }

                if ($this->claim($user) === 1) {
                    $user->notify(new WeeklySummaryNotification($summary));
                }
            }
        });
    }

    /** @return Builder<User> */
    private function due(): Builder
    {
        return User::query()
            ->where('weekly_summary_opt_in', true)
            ->whereNotNull('email_verified_at')
            ->where(static fn (Builder $query): Builder => $query
                ->whereNull('weekly_summary_sent_at')
                ->orWhere('weekly_summary_sent_at', '<', now()->subDays(self::MIN_DAYS_BETWEEN)));
    }

    /** 1, ha ez a futas foglalta le a hetet; 0, ha kozben mas kuldte vagy kikapcsoltak. */
    private function claim(User $user): int
    {
        return $this->due()->whereKey($user->id)->update(['weekly_summary_sent_at' => now()]);
    }
}
