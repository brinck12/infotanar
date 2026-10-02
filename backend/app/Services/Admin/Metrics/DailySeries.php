<?php

declare(strict_types=1);

namespace App\Services\Admin\Metrics;

use Illuminate\Database\Eloquent\Builder as EloquentBuilder;
use Illuminate\Database\Query\Builder;

/**
 * Napi idosorok (#160): egy lekerdezes eredmenyenek csoportositasa helyi napok szerint, SQL-ben.
 * Szakaszonkent egy lekerdezes (egy idoszakon belul legfeljebb ket szakasz van: legfeljebb
 * egy oraallitas), tehat a lekerdezesek szama nem fugg az adatmennyisegtol.
 */
final class DailySeries
{
    public function __construct(private readonly SqlDialect $dialect) {}

    /**
     * Soronkent 1: hany sor esett az adott napra.
     *
     * @param  Builder|EloquentBuilder<*>  $query
     * @return array<string, int> nap => darabszam; minden napra van ertek (0 is)
     */
    public function counts(Builder|EloquentBuilder $query, string $column, LocalDayRange $range): array
    {
        return $this->aggregate($query, $column, $range, 'COUNT(*)');
    }

    /**
     * Egy oszlop osszege napokra.
     *
     * @param  Builder|EloquentBuilder<*>  $query
     * @return array<string, int>
     */
    public function sums(Builder|EloquentBuilder $query, string $column, LocalDayRange $range, string $sumColumn): array
    {
        return $this->aggregate($query, $column, $range, "COALESCE(SUM({$sumColumn}), 0)");
    }

    /**
     * Egy oszlop kulonbozo ertekeinek szama napokra (pl. aktiv tanulok).
     *
     * @param  Builder|EloquentBuilder<*>  $query
     * @return array<string, int>
     */
    public function distinct(Builder|EloquentBuilder $query, string $column, LocalDayRange $range, string $distinctColumn): array
    {
        return $this->aggregate($query, $column, $range, "COUNT(DISTINCT {$distinctColumn})");
    }

    /**
     * @param  Builder|EloquentBuilder<*>  $query
     * @return array<string, int>
     */
    private function aggregate(Builder|EloquentBuilder $query, string $column, LocalDayRange $range, string $expression): array
    {
        $series = array_fill_keys($range->days, 0);
        $base = $query instanceof EloquentBuilder ? $query->toBase() : $query;

        foreach ($range->segments as $segment) {
            $rows = (clone $base)
                ->where($column, '>=', $segment['from'])
                ->where($column, '<', $segment['to'])
                ->selectRaw($this->dialect->localDate($column, $segment['offset']).' AS day, '.$expression.' AS value')
                ->groupBy('day')
                ->get();

            foreach ($rows as $row) {
                $series[Cast::string($row->day)] = Cast::int($row->value);
            }
        }

        return $series;
    }
}
