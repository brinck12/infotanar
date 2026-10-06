<?php

declare(strict_types=1);

namespace App\Services\Health\Checks;

use App\Services\Health\CheckResult;
use App\Services\Health\HealthCheck;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Storage;
use Throwable;

/**
 * Az ejszakai mentes (deploy/backup/infotanar-backup.sh, #129) siker eseten
 * egy fajlba irja az idopontot. Hianya vagy regisege figyelmeztetes: a
 * kiszolgalast nem erinti, de egy lemezhiba ekkor adatvesztes.
 */
final class BackupFreshnessCheck implements HealthCheck
{
    public const STATUS_FILE = 'backup-last-success';

    public function name(): string
    {
        return 'backup';
    }

    public function run(): CheckResult
    {
        $recorded = Storage::disk('local')->get(self::STATUS_FILE);

        if ($recorded === null) {
            return CheckResult::degraded('Még nem készült mentés (vagy az időzítő nincs telepítve).');
        }

        try {
            $lastSuccess = Carbon::parse(trim($recorded));
        } catch (Throwable) {
            return CheckResult::degraded('A mentés időpontja nem olvasható.');
        }

        $hours = (int) $lastSuccess->diffInHours(now());
        $detail = "Utolsó sikeres mentés {$hours} órája.";

        return $hours > Config::integer('health.backup_max_age_hours')
            ? CheckResult::degraded($detail)
            : CheckResult::ok($detail);
    }
}
