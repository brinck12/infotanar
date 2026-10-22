<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\User;
use App\Services\Notifications\UnsubscribeLinks;
use App\Services\Progress\WeeklySummary;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Config;
use Symfony\Component\Mime\Email;

/**
 * Heti osszefoglalo (opt-in). A hang unnepelo: csak az szerepel, ami a heten tortent;
 * hianyzo napokrol, lemaradasrol szo sincs. A leiratkozas egy kattintas (link a levelben es
 * `List-Unsubscribe` fejlec).
 */
final class WeeklySummaryNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(private readonly WeeklySummary $summary)
    {
        $this->afterCommit();
    }

    /** @return list<string> */
    public function via(User $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(User $notifiable): MailMessage
    {
        $links = UnsubscribeLinks::for($notifiable);

        $mail = (new MailMessage)
            ->subject(__('rhythm.mail.subject'))
            ->greeting(__('rhythm.mail.greeting', ['name' => $notifiable->name]))
            ->line(__('rhythm.mail.intro', ['days' => $this->summary->activeDays]));

        if ($this->summary->lessonsCompleted > 0) {
            $mail->line(__('rhythm.mail.lessons', ['count' => $this->summary->lessonsCompleted]));
        }

        if ($this->summary->submissions > 0) {
            $mail->line(__('rhythm.mail.submissions', ['count' => $this->summary->submissions]));
        }

        return $mail
            ->action(__('rhythm.mail.action'), Config::string('app.frontend_url').'/tanulasi-ut')
            ->line(__('rhythm.mail.unsubscribe', ['url' => $links['frontend']]))
            ->withSymfonyMessage(static function (Email $message) use ($links): void {
                $message->getHeaders()
                    ->addTextHeader('List-Unsubscribe', '<'.$links['api'].'>')
                    ->addTextHeader('List-Unsubscribe-Post', 'List-Unsubscribe=One-Click');
            });
    }
}
