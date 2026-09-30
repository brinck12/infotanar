<?php

declare(strict_types=1);

namespace App\Services\Billing\Barion;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Vekony kliens a Barion Smart Gateway API-hoz (ADR 0001). A POSKey soha
 * nem kerul naploba vagy valaszba; hiba eseten BarionException (magyar,
 * altalanos uzenettel), a reszletek csak a naploba mennek.
 */
final class BarionClient
{
    /**
     * Fizetes inditasa (elso fizetes token-regisztracioval, vagy tokenes megujitas).
     *
     * @param  array<string, mixed>  $payload  POSKey nelkul; azt itt tesszuk hozza
     *
     * @throws BarionException
     */
    public function startPayment(array $payload): StartedPayment
    {
        $data = $this->decode($this->send(fn () => $this->http()->post('/v2/Payment/Start', [
            'POSKey' => $this->posKey(),
            ...$payload,
        ])), 'Payment/Start');

        $paymentId = $data['PaymentId'] ?? null;
        $gatewayUrl = $data['GatewayUrl'] ?? null;

        if (! is_string($paymentId) || $paymentId === '' || ! is_string($gatewayUrl)) {
            Log::error('Barion Payment/Start: missing PaymentId or GatewayUrl.');

            throw BarionException::unexpectedResponse();
        }

        return new StartedPayment(
            paymentId: $paymentId,
            gatewayUrl: $gatewayUrl,
            status: is_string($data['Status'] ?? null) ? $data['Status'] : 'Unknown',
        );
    }

    /**
     * A fizetes valodi allapota. A callbacknek NEM hiszunk (alairatlan), mindig innen kerdezunk.
     *
     * @throws BarionException
     */
    public function paymentState(string $paymentId): PaymentStateSnapshot
    {
        $data = $this->decode($this->send(fn () => $this->http()
            ->withHeaders(['x-pos-key' => $this->posKey()])
            ->get('/v4/Payment/'.rawurlencode($paymentId).'/PaymentState')), 'PaymentState');

        $status = $data['Status'] ?? null;
        if (! is_string($status)) {
            throw BarionException::unexpectedResponse();
        }

        return new PaymentStateSnapshot(
            paymentId: $paymentId,
            status: $status,
            paymentRequestId: is_string($data['PaymentRequestId'] ?? null) ? $data['PaymentRequestId'] : null,
            recurrenceResult: is_string($data['RecurrenceResult'] ?? null) ? $data['RecurrenceResult'] : null,
            total: is_numeric($data['Total'] ?? null) ? (int) round((float) $data['Total']) : null,
            currency: is_string($data['Currency'] ?? null) ? $data['Currency'] : null,
        );
    }

    /**
     * @param  callable(): Response  $request
     *
     * @throws BarionException
     */
    private function send(callable $request): Response
    {
        try {
            return $request();
        } catch (ConnectionException $e) {
            Log::error('Barion: request failed.', ['error' => $e->getMessage()]);

            throw BarionException::unreachable($e);
        }
    }

    /**
     * @return array<string, mixed>
     *
     * @throws BarionException
     */
    private function decode(Response $response, string $operation): array
    {
        $data = $response->json();
        $errors = is_array($data) ? ($data['Errors'] ?? []) : [];

        if ($response->failed() || ! is_array($data) || (is_array($errors) && $errors !== [])) {
            // A Barion hibauzenetei (ErrorCode, Title) csak a naploba kerulnek.
            Log::warning("Barion {$operation} returned an error.", [
                'status' => $response->status(),
                'errors' => is_array($errors) ? $errors : [],
            ]);

            throw BarionException::rejected();
        }

        $typed = [];
        foreach ($data as $key => $value) {
            $typed[(string) $key] = $value;
        }

        return $typed;
    }

    private function http(): PendingRequest
    {
        $override = Config::get('billing.barion.base_url_override');
        $environment = Config::string('billing.barion.environment');
        $baseUrl = is_string($override) && $override !== ''
            ? $override
            : Config::string("billing.barion.base_urls.{$environment}");

        return Http::baseUrl($baseUrl)
            ->acceptJson()
            ->asJson()
            ->connectTimeout(5)
            ->timeout(Config::integer('billing.barion.timeout'));
    }

    /** @throws BarionException */
    /**
     * A bolt Barion-fiokja, amelyre a tranzakciok erkeznek.
     *
     * @throws BarionException
     */
    public function payee(): string
    {
        return $this->requiredSetting('payee', 'BARION_PAYEE');
    }

    private function posKey(): string
    {
        return $this->requiredSetting('pos_key', 'BARION_POS_KEY');
    }

    private function requiredSetting(string $key, string $env): string
    {
        $value = Config::get('billing.barion.'.$key);

        if (! is_string($value) || $value === '') {
            Log::critical("Barion: {$env} is not configured.");

            throw BarionException::notConfigured();
        }

        return $value;
    }
}
