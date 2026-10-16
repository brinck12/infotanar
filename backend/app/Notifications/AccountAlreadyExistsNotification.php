<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Config;

/**
 * Tajekoztato level a meglevo fiok tulajdonosanak, ha valaki ugyanezzel a
 * cimmel regisztralni probal (B13). A regisztracios valasz nem fedi fel a
 * fiok letezeset, ezert csak a tulajdonos tud rola.
 */
final class AccountAlreadyExistsNotification extends Notification implements ShouldQueue
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
            ->subject(__('auth.register.exists_mail.subject'))
            ->greeting(__('auth.register.exists_mail.greeting', ['name' => $notifiable->name]))
            ->line(__('auth.register.exists_mail.intro'))
            ->action(__('auth.register.exists_mail.action'), Config::string('app.frontend_url').'/bejelentkezes')
            ->line(__('auth.register.exists_mail.forgot'))
            ->line(__('auth.register.exists_mail.outro'));
    }
}
