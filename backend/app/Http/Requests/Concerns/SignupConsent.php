<?php

declare(strict_types=1);

namespace App\Http\Requests\Concerns;

use App\Services\Registration\RegistrationGate;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Az uj fiok nyitasanak kozos mezoi (jelszavas es Google-os): az elfogadott
 * dokumentumok verzioja (#133) es zart betaban a meghivokod. A szabalyokat az
 * AdmitNewUser ellenorzi veglegesen; ez csak a korai, mezoszintu hiba.
 *
 * @phpstan-require-extends FormRequest
 */
trait SignupConsent
{
    /**
     * @param  list<mixed>  $inviteCodeExtraRules  a meghivokod szabalyai a kotelezo mellett
     * @return array<string, array<int, mixed>>
     */
    protected function consentRules(array $inviteCodeExtraRules = []): array
    {
        $rules = [
            'accept_terms' => ['accepted'],
            'terms_version' => ['required', 'string', 'max:32'],
            'privacy_version' => ['required', 'string', 'max:32'],
        ];

        if (app(RegistrationGate::class)->requiresInvite()) {
            $rules['invite_code'] = ['required', 'string', 'max:64', ...$inviteCodeExtraRules];
        }

        return $rules;
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'accept_terms.accepted' => __('auth.register.accept_terms'),
            'invite_code.required' => __('auth.invite.required'),
        ];
    }

    public function inviteCode(): ?string
    {
        $code = $this->input('invite_code');

        return is_string($code) ? $code : null;
    }
}
