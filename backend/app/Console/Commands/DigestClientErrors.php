<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Notifications\ClientErrorDigestNotification;
use App\Support\Alerts\ClientErrorSanitizer;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Notification;

/**
 * Napi osszegzo az elozo nap bongeszo-hibairol (production-readiness OPS-9).
 * A naplo napi fajl (client-YYYY-MM-DD.log); ures napon nem megy level.
 */
class DigestClientErrors extends Command
{
    private const TOP = 10;

    protected $signature = 'logs:digest-client-errors {--date= : A nap (ÉÉÉÉ-HH-NN); alapból a tegnapi}';

    protected $description = 'Levélben összegzi az előző nap böngészőhibáit az ALERT_EMAIL címre';

    public function handle(): int
    {
        $date = $this->option('date');
        $day = is_string($date) && $date !== '' ? $date : now()->subDay()->toDateString();
        $path = storage_path("logs/client-{$day}.log");

        if (! is_file($path)) {
            return self::SUCCESS;
        }

        $groups = $this->groups($path);

        if ($groups === []) {
            return self::SUCCESS;
        }

        $recipient = Config::get('alerts.email');

        if (! is_string($recipient) || $recipient === '') {
            $this->warn('Nincs ALERT_EMAIL: az összegző nem megy ki.');

            return self::SUCCESS;
        }

        arsort($groups);
        $total = array_sum($groups);
        $top = [];

        foreach (array_slice($groups, 0, self::TOP, true) as $key => $count) {
            [$message, $url] = explode("\n", (string) $key, 2) + ['', ''];
            $top[] = ['message' => $message, 'url' => $url, 'count' => $count];
        }

        Notification::route('mail', $recipient)->notifyNow(new ClientErrorDigestNotification($day, $total, $top));

        return self::SUCCESS;
    }

    /** @return array<string, int> "uzenet\nurl" => darabszam */
    private function groups(string $path): array
    {
        $groups = [];
        $handle = fopen($path, 'rb');

        if ($handle === false) {
            return [];
        }

        while (($line = fgets($handle)) !== false) {
            // [2026-10-13 12:00:00] production.ERROR: uzenet {"url":"...", ...}
            if (preg_match('/^\[[^\]]+\] \S+\.ERROR: (.*?) (\{.*\})\s*$/', $line, $m) !== 1) {
                continue;
            }

            $context = json_decode($m[2], true);
            $url = is_array($context) && is_string($context['url'] ?? null) ? $context['url'] : '';
            $key = ClientErrorSanitizer::message($m[1])."\n".ClientErrorSanitizer::url($url);
            $groups[$key] = ($groups[$key] ?? 0) + 1;
        }

        fclose($handle);

        return $groups;
    }
}
