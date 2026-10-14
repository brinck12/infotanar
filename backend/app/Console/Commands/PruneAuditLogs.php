<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\AuditLog;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Config;

/**
 * Az audit naplo megorzesi korlatja (PRIV-4, naponta, routes/console.php): a
 * `privacy.audit_ip_retention_days` napnal regebbi sorokrol lekerul az IP-cim,
 * es csak ha `privacy.audit_delete_after_years` be van allitva, a regi sorok torlodnek.
 * Ujrafuttathato.
 */
final class PruneAuditLogs extends Command
{
    protected $signature = 'audit:prune';

    protected $description = 'Az audit napló régi IP-címeinek nullázása, és beállítás esetén a régi sorok törlése';

    public function handle(): int
    {
        $days = max(1, Config::integer('privacy.audit_ip_retention_days'));

        AuditLog::query()
            ->whereNotNull('ip_address')
            ->where('created_at', '<', now()->subDays($days))
            ->update(['ip_address' => null]);

        $this->info('A régi audit sorok IP-címe nullázva.');

        $years = Config::get('privacy.audit_delete_after_years');

        if (is_int($years) && $years > 0) {
            AuditLog::query()->where('created_at', '<', now()->subYears($years))->delete();

            $this->info('A lejárt audit sorok törölve.');
        }

        return self::SUCCESS;
    }
}
