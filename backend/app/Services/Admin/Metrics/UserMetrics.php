<?php

declare(strict_types=1);

namespace App\Services\Admin\Metrics;

use App\Enums\PaymentPurpose;
use App\Enums\PaymentStatus;
use App\Enums\Role;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

/**
 * Felhasznalok (#160): csak diakok szamitanak (az admin nem). A definiciok: docs/architecture.md.
 */
final class UserMetrics
{
    public function __construct(private readonly DailySeries $series) {}

    /**
     * @return array{
     *     daily: array<string, int>, registered: int, registered_previous: int,
     *     verified_ratio: float|null, conversion: float|null, conversion_previous: float|null
     * }
     */
    public function collect(LocalDayRange $range, LocalDayRange $previous): array
    {
        $daily = $this->series->counts($this->students(), 'created_at', $range);
        $registered = array_sum($daily);
        $verified = $this->registeredIn($range)->whereNotNull('email_verified_at')->count();

        return [
            'daily' => $daily,
            'registered' => $registered,
            'registered_previous' => $this->registeredIn($previous)->count(),
            'verified_ratio' => $this->ratio($verified, $registered),
            'conversion' => $this->conversion($range),
            'conversion_previous' => $this->conversion($previous),
        ];
    }

    /**
     * Az idoszakban regisztraltak kozul hanyadan fizettek mar (sikeres elso fizetes, a mai napig).
     */
    private function conversion(LocalDayRange $range): ?float
    {
        $registered = $this->registeredIn($range)->count();
        $paid = $this->registeredIn($range)
            ->whereExists(Payment::query()
                ->selectRaw('1')
                ->whereColumn('payments.user_id', 'users.id')
                ->where('status', PaymentStatus::Succeeded)
                ->where('purpose', PaymentPurpose::Initial))
            ->count();

        return $this->ratio($paid, $registered);
    }

    /** @return Builder<User> */
    private function registeredIn(LocalDayRange $range): Builder
    {
        return $this->students()->where('created_at', '>=', $range->from)->where('created_at', '<', $range->to);
    }

    /** @return Builder<User> */
    private function students(): Builder
    {
        return User::query()->where('role', Role::Student);
    }

    private function ratio(int $part, int $whole): ?float
    {
        return $whole === 0 ? null : round($part / $whole, 4);
    }
}
