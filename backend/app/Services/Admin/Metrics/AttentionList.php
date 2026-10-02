<?php

declare(strict_types=1);

namespace App\Services\Admin\Metrics;

use App\Enums\InvoiceStatus;
use App\Enums\PaymentStatus;
use App\Models\Exercise;
use App\Models\Invoice;
use App\Models\Payment;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;

/** Ami az admin figyelmet kerdi (#160); a definiciok: docs/architecture.md. */
final class AttentionList
{
    /** Legfeljebb ennyi megoldhatatlannak tuno feladatot listazunk. */
    private const UNSOLVED_LIMIT = 10;

    /**
     * @return array{
     *     failed_invoices: int, stale_payments: int, failed_jobs: int,
     *     unsolved_exercises: list<array{id: int, title: string, attempts: int}>
     * }
     */
    public function collect(CarbonImmutable $now): array
    {
        return [
            'failed_invoices' => Invoice::query()->where('status', InvoiceStatus::Failed)->count(),
            'stale_payments' => Payment::query()
                ->where('status', PaymentStatus::Pending)
                ->where('created_at', '<', $now->subHours(Config::integer('dashboard.pending_payment_hours')))
                ->count(),
            'failed_jobs' => DB::table('failed_jobs')->count(),
            'unsolved_exercises' => $this->unsolvedExercises(),
        ];
    }

    /**
     * Sok probalkozas, egyetlen elfogadott beadas sem: vagy tul nehez, vagy hibas a teszteset.
     *
     * @return list<array{id: int, title: string, attempts: int}>
     */
    private function unsolvedExercises(): array
    {
        $rows = DB::table('submissions')
            ->select('exercise_id', DB::raw('COUNT(*) AS attempts'))
            ->groupBy('exercise_id')
            ->havingRaw('COUNT(*) > ?', [Config::integer('dashboard.unsolved_attempts')])
            ->havingRaw("SUM(CASE WHEN status = 'passed' THEN 1 ELSE 0 END) = 0")
            ->orderByDesc('attempts')
            ->limit(self::UNSOLVED_LIMIT)
            ->get();

        $titles = Exercise::query()->whereIn('id', $rows->pluck('exercise_id'))->pluck('title', 'id');

        return array_values($rows
            ->map(static fn (object $row): array => [
                'id' => Cast::int($row->exercise_id),
                'title' => Cast::string($titles[$row->exercise_id] ?? ''),
                'attempts' => Cast::int($row->attempts),
            ])
            ->all());
    }
}
