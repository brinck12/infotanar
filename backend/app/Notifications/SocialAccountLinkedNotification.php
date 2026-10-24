<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Ertesites a fiok tulajdonosanak, ha egy meglevo fiokot elso Google-belepes kotott ossze:
 * ha nem o volt, igy szerez rola tudomast.
 */
final class SocialAccountLinkedNotification extends Notification implements ShouldQueue
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
            ->subject(__('auth.social.linked_mail.subject'))
            ->greeting(__('auth.social.linked_mail.greeting', ['name' => $notifiable->name]))
            ->line(__('auth.social.linked_mail.intro'))
            ->line(__('auth.social.linked_mail.outro'));
    }
}
