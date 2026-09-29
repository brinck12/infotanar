<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Config;

final class ResetPasswordNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(private readonly string $token)
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
        $url = Config::string('app.frontend_url').'/jelszo-visszaallitas?'.http_build_query([
            'token' => $this->token,
            'email' => $notifiable->getEmailForPasswordReset(),
        ]);

        return (new MailMessage)
            ->subject(__('auth.password_reset.mail.subject'))
            ->greeting(__('auth.password_reset.mail.greeting', ['name' => $notifiable->name]))
            ->line(__('auth.password_reset.mail.intro'))
            ->action(__('auth.password_reset.mail.action'), $url)
            ->line(__('auth.password_reset.mail.expiry', ['minutes' => Config::integer('auth.passwords.users.expire')]))
            ->line(__('auth.password_reset.mail.outro'));
    }
}
