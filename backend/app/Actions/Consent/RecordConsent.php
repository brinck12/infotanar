<?php

declare(strict_types=1);

namespace App\Actions\Consent;

use App\Enums\ConsentType;
use App\Models\Consent;
use App\Models\Payment;
use App\Models\User;
use App\Support\Privacy\IpAnonymizer;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

/**
 * Egy nyilatkozat rogzitese a keres koruelmenyeivel (IP, bongeszo) egyutt,
 * hogy kesobb igazolhato legyen, ki mit fogadott el (#133).
 */
final readonly class RecordConsent
{
    public function __construct(private Request $request) {}

    public function handle(User $user, ConsentType $type, string $documentVersion, ?Payment $payment = null): Consent
    {
        return Consent::create([
            'user_id' => $user->id,
            'type' => $type,
            'document_version' => $documentVersion,
            'payment_id' => $payment?->id,
            // /24 (IPv4) vagy /48 (IPv6) csonkolas: a bizonyitashoz az orszag/halozat eleg (PRIV-4).
            'ip_address' => IpAnonymizer::truncate($this->request->ip()),
            'user_agent' => Str::limit((string) $this->request->userAgent(), 500, ''),
        ]);
    }
}
