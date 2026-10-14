<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Ertesites jelszocsere (belepve vagy visszaallitassal) utan: ha nem a tulajdonos
 * csinalta, innen tudja meg, es meg ideje van lepni (PRIV-10).
 */
final class PasswordChangedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct()
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
            ->subject(__('auth.password_change.mail.subject'))
            ->greeting(__('auth.password_change.mail.greeting', ['name' => $notifiable->name]))
            ->line(__('auth.password_change.mail.intro'))
            ->line(__('auth.password_change.mail.outro'));
    }
}
