<?php

declare(strict_types=1);

namespace App\Services\Billing\Szamlazz;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Vekony kliens a Szamlazz.hu Szamla Agenthez (ADR 0002). Minden muvelet egy
 * multipart POST ugyanarra az URL-re; a muveletet a fajlmezo neve donti el.
 * Az eredmeny es a hiba a `szlahu_*` valaszfejlecekben jon. Az agent-kulcs
 * soha nem kerul naploba.
 */
final class SzamlazzClient
{
    private const ACTION_ISSUE = 'action-xmlagentxmlfile';

    private const ACTION_QUERY = 'action-szamla_agent_xml';

    private const ACTION_PDF = 'action-szamla_agent_pdf';

    /** @throws SzamlazzException */
    public function issue(string $xml): IssuedInvoice
    {
        $response = $this->send(self::ACTION_ISSUE, $xml);
        $number = $response->header('szlahu_szamlaszam');

        if ($number === '') {
            throw SzamlazzException::unexpectedResponse('missing szlahu_szamlaszam');
        }

        return new IssuedInvoice($number, $this->pdfBody($response));
    }

    /**
     * A rendelesszamhoz mar kiallitott szamla szama, ha van. Csak bizonytalan
     * kimenetelu kiallitas utan hivjuk, hogy ne keszuljon ketszer szamla.
     *
     * @throws SzamlazzException
     */
    public function findNumberByOrder(string $xml): ?string
    {
        try {
            $response = $this->send(self::ACTION_QUERY, $xml);
        } catch (SzamlazzException $e) {
            // Az Agent a "nincs ilyen szamla" esetet is hibakoddal jelzi.
            if (! $e->retryable) {
                return null;
            }

            throw $e;
        }

        return preg_match('#<szamlaszam>([^<]+)</szamlaszam>#', $response->body(), $m) === 1 ? trim($m[1]) : null;
    }

    /** @throws SzamlazzException */
    public function pdf(string $xml): string
    {
        $pdf = $this->pdfBody($this->send(self::ACTION_PDF, $xml));

        if ($pdf === null) {
            throw SzamlazzException::unexpectedResponse('no PDF in response');
        }

        return $pdf;
    }

    /** @throws SzamlazzException */
    public function agentKey(): string
    {
        $key = Config::get('billing.szamlazz.agent_key');

        if (! is_string($key) || $key === '') {
            Log::critical('Szamlazz.hu: SZAMLAZZ_AGENT_KEY is not configured.');

            throw SzamlazzException::notConfigured();
        }

        return $key;
    }

    /** @throws SzamlazzException */
    private function send(string $action, string $xml): Response
    {
        try {
            $response = $this->http()->attach($action, $xml, 'request.xml', ['Content-Type' => 'text/xml'])->post('');
        } catch (ConnectionException $e) {
            // Idotullepesnel a szamla elkeszulhetett: a hivo ra fog kerdezni.
            throw SzamlazzException::uncertain($e);
        }

        $errorCode = $response->header('szlahu_error_code');

        if ($errorCode !== '') {
            $message = urldecode($response->header('szlahu_error'));
            Log::warning('Szamlazz.hu Agent returned an error.', ['action' => $action, 'code' => $errorCode, 'error' => $message]);

            throw SzamlazzException::rejected($errorCode, $message);
        }

        if ($response->serverError()) {
            throw SzamlazzException::unavailable($response->status());
        }

        if ($response->failed()) {
            throw SzamlazzException::unexpectedResponse('HTTP '.$response->status());
        }

        return $response;
    }

    private function pdfBody(Response $response): ?string
    {
        $body = $response->body();

        return str_starts_with($body, '%PDF') ? $body : null;
    }

    private function http(): PendingRequest
    {
        return Http::baseUrl(Config::string('billing.szamlazz.base_url'))
            ->connectTimeout(5)
            ->timeout(Config::integer('billing.szamlazz.timeout'));
    }
}
