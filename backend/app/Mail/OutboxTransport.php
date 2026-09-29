<?php

declare(strict_types=1);

namespace App\Mail;

use Illuminate\Support\Str;
use Symfony\Component\Mailer\SentMessage;
use Symfony\Component\Mailer\Transport\AbstractTransport;
use Symfony\Component\Mime\Address;
use Symfony\Component\Mime\Message;
use Symfony\Component\Mime\MessageConverter;

/**
 * Csak tesztkornyezethez (MAIL_MAILER=outbox): minden levelet JSON fajlkent
 * ir ki, hogy a Playwright API tesztek kiolvashassak a benne levo linkeket.
 */
final class OutboxTransport extends AbstractTransport
{
    public function __construct(private readonly string $path)
    {
        parent::__construct();
    }

    protected function doSend(SentMessage $message): void
    {
        $original = $message->getOriginalMessage();

        if (! $original instanceof Message) {
            return;
        }

        $email = MessageConverter::toEmail($original);

        if (! is_dir($this->path)) {
            mkdir($this->path, 0775, true);
        }

        file_put_contents(
            sprintf('%s/%s-%s.json', $this->path, now()->format('Uu'), Str::random(6)),
            json_encode([
                'to' => array_map(static fn (Address $address): string => $address->getAddress(), $email->getTo()),
                'subject' => $email->getSubject(),
                'text' => $email->getTextBody(),
                'html' => $email->getHtmlBody(),
            ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR),
        );
    }

    public function __toString(): string
    {
        return 'outbox';
    }
}
