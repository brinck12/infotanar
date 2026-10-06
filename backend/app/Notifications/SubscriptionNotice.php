<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Enums\SubscriptionNoticeType;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Lang;

/**
 * Az elofizetes eletciklusanak levelei (#137). A szoveg teljes egeszeben a
 * `lang/hu/billing.php` `mail.<tipus>` blokkjabol jon (targy, sorok,
 * opcionalis gomb), igy uj level felvetelehez vagy atfogalmazashoz nem kell
 * kodot irni.
 */
final class SubscriptionNotice extends Notification implements ShouldQueue
{
    use Queueable;

    /** @param array<string, string> $placeholders */
    public function __construct(
        private readonly SubscriptionNoticeType $type,
        private readonly array $placeholders,
    ) {
        $this->afterCommit();
    }

    /** @return list<string> */
    public function via(User $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(User $notifiable): MailMessage
    {
        $key = "billing.mail.{$this->type->value}";

        $mail = (new MailMessage)
            ->subject(__("{$key}.subject"))
            ->greeting(__('billing.mail.greeting', ['name' => $notifiable->name]));

        foreach ((array) Lang::get("{$key}.lines", $this->placeholders) as $line) {
            $mail->line($line);
        }

        if (Lang::has("{$key}.action")) {
            $mail->action(__("{$key}.action"), Config::string('app.frontend_url').'/elofizetes');
        }

        return $mail;
    }
}
