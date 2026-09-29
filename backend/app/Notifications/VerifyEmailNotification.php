<?php

namespace App\Notifications;

use App\Models\User;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\URL;

class VerifyEmailNotification extends Notification
{
    /** @return list<string> */
    public function via(User $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(User $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Erősítsd meg az e-mail-címed')
            ->greeting('Szia '.$notifiable->name.'!')
            ->line('Kattints az alábbi gombra az e-mail-címed megerősítéséhez.')
            ->action('E-mail-cím megerősítése', $this->frontendUrl($notifiable))
            ->line('A link '.config('auth.verification.expire', 60).' percig érvényes.')
            ->line('Ha nem te regisztráltál, hagyd figyelmen kívül ezt a levelet.');
    }

    /**
     * A link a frontend megerosito oldalara mutat; az oldal a query
     * parametereket valtozatlanul tovabbadja az API-nak. Relativ alairas,
     * mert a backend host (APP_URL) proxy mogott eltérhet.
     */
    private function frontendUrl(User $user): string
    {
        $signed = URL::temporarySignedRoute(
            'api.verification.verify',
            now()->addMinutes((int) config('auth.verification.expire', 60)),
            ['id' => $user->getKey(), 'hash' => sha1($user->getEmailForVerification())],
            absolute: false,
        );

        $query = (string) parse_url($signed, PHP_URL_QUERY);

        return config('app.frontend_url').'/email-megerosites?'.http_build_query([
            'id' => $user->getKey(),
            'hash' => sha1($user->getEmailForVerification()),
        ]).'&'.$query;
    }
}
