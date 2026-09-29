<?php

namespace App\Notifications;

use App\Models\User;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ResetPasswordNotification extends Notification
{
    public function __construct(private readonly string $token) {}

    /** @return list<string> */
    public function via(User $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(User $notifiable): MailMessage
    {
        $url = config('app.frontend_url').'/jelszo-visszaallitas?'.http_build_query([
            'token' => $this->token,
            'email' => $notifiable->getEmailForPasswordReset(),
        ]);

        return (new MailMessage)
            ->subject('Jelszó visszaállítása')
            ->greeting('Szia '.$notifiable->name.'!')
            ->line('Jelszó-visszaállítást kértek a fiókodhoz.')
            ->action('Új jelszó beállítása', $url)
            ->line('A link '.config('auth.passwords.users.expire').' percig érvényes, és csak egyszer használható.')
            ->line('Ha nem te kérted, hagyd figyelmen kívül ezt a levelet, a jelszavad nem változik.');
    }
}
