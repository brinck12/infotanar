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

/**
 * Megerosito link az UJ e-mail-cimre (#135). A cimzett meg nem a fiok cime,
 * ezert on-demand ertesiteskent megy (Notification::route).
 */
final class ConfirmEmailChangeNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(private readonly User $user)
    {
        $this->afterCommit();
    }

    /** @return list<string> */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $minutes = Config::integer('auth.verification.expire', 60);

        return (new MailMessage)
            ->subject(__('auth.email_change.confirm_mail.subject'))
            ->greeting(__('auth.email_change.confirm_mail.greeting', ['name' => $this->user->name]))
            ->line(__('auth.email_change.confirm_mail.intro'))
            ->action(__('auth.email_change.confirm_mail.action'), $this->frontendUrl($minutes))
            ->line(__('auth.email_change.confirm_mail.expiry', ['minutes' => $minutes]))
            ->line(__('auth.email_change.confirm_mail.outro'));
    }

    /** A frontend oldala nyitja meg, es az tovabbitja az alairt parametereket az API-nak. */
    private function frontendUrl(int $minutes): string
    {
        $routeParameters = [
            'id' => $this->user->getKey(),
            'hash' => sha1((string) $this->user->pending_email),
        ];

        $signed = URL::temporarySignedRoute(
            'api.account.email.confirm',
            now()->addMinutes($minutes),
            $routeParameters,
            absolute: false,
        );

        return Config::string('app.frontend_url').'/email-csere?'
            .http_build_query($routeParameters).'&'.parse_url($signed, PHP_URL_QUERY);
    }
}
