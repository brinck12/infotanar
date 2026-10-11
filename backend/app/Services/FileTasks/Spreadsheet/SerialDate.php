<?php

declare(strict_types=1);

namespace App\Services\FileTasks\Spreadsheet;

use App\Services\FileTasks\Grammar\Numbers;

/**
 * Datumok es idopontok a tablazatkezelok sorszamos abrazolasaban: a napok
 * szama 1899-12-30 ota, az ido a nap tortresze. Az xlsx igy tarolja a
 * datumot; az ods ISO-szoveget tarol, amit erre valtunk at, hogy a ket
 * formatum cellai ugyanugy legyenek osszevethetok.
 */
final class SerialDate
{
    /** A Unix-idoszamitas kezdete (1970-01-01) sorszamkent. */
    private const UNIX_EPOCH = 25569;

    private const SECONDS_PER_DAY = 86400;

    /** Naptari datum sorszama; null, ha a datum nem letezik. */
    public static function fromDate(int $year, int $month, int $day): ?float
    {
        if ($year < 1900 || $year > 9999 || ! checkdate($month, $day, $year)) {
            return null;
        }

        return (float) (intdiv((int) gmmktime(0, 0, 0, $month, $day, $year), self::SECONDS_PER_DAY) + self::UNIX_EPOCH);
    }

    public static function fromTime(int $hours, int $minutes, float $seconds = 0.0): float
    {
        return ($hours * 3600 + $minutes * 60 + $seconds) / self::SECONDS_PER_DAY;
    }

    /** ODF `office:date-value`: "2024-05-03" vagy "2024-05-03T10:30:00". */
    public static function fromIso(string $value): ?float
    {
        if (preg_match('/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2}(?:\.\d+)?))?)?/', trim($value), $match) !== 1) {
            return null;
        }

        $date = self::fromDate((int) $match[1], (int) $match[2], (int) $match[3]);

        if ($date === null) {
            return null;
        }

        return isset($match[4])
            ? $date + self::fromTime((int) $match[4], (int) $match[5], (float) ($match[6] ?? 0))
            : $date;
    }

    /** ODF `office:time-value`: "PT12H30M00S" (az orak szama 24 folott is lehet). */
    public static function fromDuration(string $value): ?float
    {
        if (preg_match('/^(-)?PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:[.,]\d+)?)S)?$/', trim($value), $match) !== 1) {
            return null;
        }

        $time = self::fromTime((int) ($match[2] ?? 0), (int) ($match[3] ?? 0), (float) str_replace(',', '.', $match[4] ?? '0'));

        return ($match[1] ?? '') === '-' ? -$time : $time;
    }

    /**
     * A szerzo altal beirt elvart datum vagy ido sorszama: "2024.05.03.",
     * "2024-05-03", "2024. 05. 03. 10:30", "12:30", "12:30:15". Null, ha nem ilyen.
     */
    public static function parseExpected(string $text): ?float
    {
        $time = '(\d{1,2}):(\d{2})(?::(\d{2}))?';

        if (preg_match('/^\s*(\d{4})\s*[.\/-]\s*(\d{1,2})\s*[.\/-]\s*(\d{1,2})\.?(?:\s+'.$time.')?\s*$/', $text, $match) === 1) {
            $date = self::fromDate((int) $match[1], (int) $match[2], (int) $match[3]);

            if ($date === null) {
                return null;
            }

            return isset($match[4]) ? $date + self::fromTime((int) $match[4], (int) $match[5], (float) ($match[6] ?? 0)) : $date;
        }

        if (preg_match('/^\s*'.$time.'\s*$/', $text, $match) === 1) {
            return self::fromTime((int) $match[1], (int) $match[2], (float) ($match[3] ?? 0));
        }

        return null;
    }

    /** A sorszam megjelenitese a diaknak a cella formatuma szerint: datum, ido vagy mindketto. */
    public static function format(float $serial, NumberFormatCode $format): string
    {
        $days = (int) floor($serial);
        $seconds = (int) round(($serial - $days) * self::SECONDS_PER_DAY);
        $parts = [];

        if ($format->hasDate()) {
            if ($days < 1 || $days > 2958465) {
                return Numbers::format($serial);
            }

            $parts[] = gmdate('Y.m.d.', ($days - self::UNIX_EPOCH) * self::SECONDS_PER_DAY);
        }

        if ($format->hasTime()) {
            $hours = intdiv($seconds, 3600) + ($format->hasDate() ? 0 : $days * 24);
            $parts[] = sprintf('%d:%02d', $hours, intdiv($seconds % 3600, 60)).($seconds % 60 === 0 ? '' : sprintf(':%02d', $seconds % 60));
        }

        return implode(' ', $parts);
    }
}
