<?php

declare(strict_types=1);

namespace App\Notifications;

use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Config;

/** Az uzemeltetonek szolo riasztas levele (lasd OperatorAlert). Szandekosan nem sorbol megy. */
final class OperatorAlertNotification extends Notification
{
    /** @param array<string, int|string|null> $context */
    public function __construct(
        private readonly string $summary,
        private readonly array $context,
    ) {}

    /** @return list<string> */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $mail = (new MailMessage)
            ->subject(__('alerts.mail.subject', ['app' => Config::string('app.name'), 'summary' => $this->summary]))
            ->greeting(__('alerts.mail.greeting'))
            ->line($this->summary);

        foreach ($this->context as $key => $value) {
            $mail->line("{$key}: ".($value ?? '–'));
        }

        return $mail->line(__('alerts.mail.environment', ['environment' => Config::string('app.env')]));
    }
}
