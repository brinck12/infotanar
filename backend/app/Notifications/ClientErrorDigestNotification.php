<?php

declare(strict_types=1);

namespace App\Notifications;

use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Config;

/** Az elozo nap bongeszo-hibainak osszegzoje az uzemeltetonek (logs:digest-client-errors). */
final class ClientErrorDigestNotification extends Notification
{
    /** @param list<array{message: string, url: string, count: int}> $top */
    public function __construct(
        private readonly string $day,
        private readonly int $total,
        private readonly array $top,
    ) {}

    /** @return list<string> */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $mail = (new MailMessage)
            ->subject(__('alerts.digest.subject', ['app' => Config::string('app.name'), 'day' => $this->day, 'total' => $this->total]))
            ->greeting(__('alerts.digest.greeting'))
            ->line(__('alerts.digest.summary', ['day' => $this->day, 'total' => $this->total]));

        foreach ($this->top as $row) {
            $mail->line(__('alerts.digest.row', ['count' => $row['count'], 'message' => $row['message'], 'url' => $row['url'] === '' ? '–' : $row['url']]));
        }

        return $mail;
    }
}
