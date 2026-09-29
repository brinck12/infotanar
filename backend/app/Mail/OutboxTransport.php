<?php

namespace App\Mail;

use Illuminate\Support\Str;
use Symfony\Component\Mailer\SentMessage;
use Symfony\Component\Mailer\Transport\AbstractTransport;
use Symfony\Component\Mime\Address;
use Symfony\Component\Mime\MessageConverter;

class OutboxTransport extends AbstractTransport
{
    public function __construct(private readonly string $path)
    {
        parent::__construct();
    }

    protected function doSend(SentMessage $message): void
    {
        $email = MessageConverter::toEmail($message->getOriginalMessage());

        if (! is_dir($this->path)) {
            mkdir($this->path, 0775, true);
        }

        $file = sprintf('%s/%s-%s.json', $this->path, now()->format('Uu'), Str::random(6));

        file_put_contents($file, json_encode([
            'to' => array_map(fn (Address $a): string => $a->getAddress(), $email->getTo()),
            'subject' => $email->getSubject(),
            'text' => $email->getTextBody(),
            'html' => $email->getHtmlBody(),
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
    }

    public function __toString(): string
    {
        return 'outbox';
    }
}
