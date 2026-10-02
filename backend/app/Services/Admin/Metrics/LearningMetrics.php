<?php

declare(strict_types=1);

namespace App\Services\Admin\Metrics;

use App\Enums\Verdict;
use App\Models\Submission;
use Illuminate\Database\Eloquent\Builder;

/**
 * Tanulas (#160): a beadasok (nem a "Futtatas") alapjan. A definiciok: docs/architecture.md.
 */
final class LearningMetrics
{
    public function __construct(private readonly DailySeries $series) {}

    /**
     * @return array{
     *     submissions_daily: array<string, int>, active_learners_daily: array<string, int>,
     *     submissions: int, submissions_previous: int,
     *     active_learners: int, active_learners_previous: int,
     *     acceptance_rate: float|null, acceptance_rate_previous: float|null,
     *     verdicts: array<string, int>
     * }
     */
    public function collect(LocalDayRange $range, LocalDayRange $previous): array
    {
        $submissions = $this->series->counts(Submission::query(), 'created_at', $range);
        $verdicts = $this->verdicts($range);

        return [
            'submissions_daily' => $submissions,
            'active_learners_daily' => $this->series->distinct(Submission::query()->whereNotNull('user_id'), 'created_at', $range, 'user_id'),
            'submissions' => array_sum($submissions),
            'submissions_previous' => $this->within($previous)->count(),
            'active_learners' => $this->activeLearners($range),
            'active_learners_previous' => $this->activeLearners($previous),
            'acceptance_rate' => $this->acceptanceRate($verdicts),
            'acceptance_rate_previous' => $this->acceptanceRate($this->verdicts($previous)),
            'verdicts' => $verdicts,
        ];
    }

    /**
     * Beadasok szama allapotonkent az idoszakban (a regi, allapot nelkuli beadasok kimaradnak).
     *
     * @return array<string, int>
     */
    private function verdicts(LocalDayRange $range): array
    {
        $rows = $this->within($range)->whereNotNull('verdict')->toBase()->selectRaw('verdict, COUNT(*) AS total')->groupBy('verdict')->get();

        $counts = [];
        foreach ($rows as $row) {
            $counts[Cast::string($row->verdict)] = Cast::int($row->total);
        }

        return $counts;
    }

    /**
     * Elfogadott / minden ertekelt beadas. A rendszerhiba nem a diak hibaja, ezert nem szamit bele.
     *
     * @param  array<string, int>  $verdicts
     */
    private function acceptanceRate(array $verdicts): ?float
    {
        unset($verdicts[Verdict::SystemError->value]);
        $considered = array_sum($verdicts);

        return $considered === 0 ? null : round(($verdicts[Verdict::Accepted->value] ?? 0) / $considered, 4);
    }

    private function activeLearners(LocalDayRange $range): int
    {
        return (int) $this->within($range)->whereNotNull('user_id')->toBase()->distinct()->count('user_id');
    }

    /** @return Builder<Submission> */
    private function within(LocalDayRange $range): Builder
    {
        return Submission::query()->where('created_at', '>=', $range->from)->where('created_at', '<', $range->to);
    }
}
