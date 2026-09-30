<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\URL;

final class VerifyEmailNotification extends Notification implements ShouldQueue
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
        $minutes = Config::integer('auth.verification.expire', 60);

        return (new MailMessage)
            ->subject(__('auth.verification.mail.subject'))
            ->greeting(__('auth.verification.mail.greeting', ['name' => $notifiable->name]))
            ->line(__('auth.verification.mail.intro'))
            ->action(__('auth.verification.mail.action'), $this->frontendUrl($notifiable, $minutes))
            ->line(__('auth.verification.mail.expiry', ['minutes' => $minutes]))
            ->line(__('auth.verification.mail.outro'));
    }

    /**
     * A link a frontend megerosito oldalara mutat; az oldal a query
     * parametereket valtozatlanul tovabbadja az API-nak. Relativ alairas,
     * mert a backend host (APP_URL) proxy mogott eltérhet.
     */
    private function frontendUrl(User $user, int $minutes): string
    {
        $routeParameters = [
            'id' => $user->getKey(),
            'hash' => sha1($user->getEmailForVerification()),
        ];

        $signed = URL::temporarySignedRoute(
            'api.auth.verification.verify',
            now()->addMinutes($minutes),
            $routeParameters,
            absolute: false,
        );

        return Config::string('app.frontend_url').'/email-megerosites?'
            .http_build_query($routeParameters).'&'.parse_url($signed, PHP_URL_QUERY);
    }
}
