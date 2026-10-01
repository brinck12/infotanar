<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Ertesites a REGI e-mail-cimre, hogy cimcseret kertek (#135): ha nem a
 * tulajdonos volt, innen tudja meg, es meg ideje van jelszot cserelni.
 */
final class EmailChangeRequestedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(private readonly string $newEmail)
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
        return (new MailMessage)
            ->subject(__('auth.email_change.notice_mail.subject'))
            ->greeting(__('auth.email_change.notice_mail.greeting', ['name' => $notifiable->name]))
            ->line(__('auth.email_change.notice_mail.intro', ['email' => $this->newEmail]))
            ->line(__('auth.email_change.notice_mail.outro'));
    }
}
