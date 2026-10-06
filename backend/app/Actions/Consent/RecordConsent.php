<?php

declare(strict_types=1);

namespace App\Actions\Consent;

use App\Enums\ConsentType;
use App\Models\Consent;
use App\Models\Payment;
use App\Models\User;
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
            'ip_address' => $this->request->ip(),
            'user_agent' => Str::limit((string) $this->request->userAgent(), 500, ''),
        ]);
    }
}
