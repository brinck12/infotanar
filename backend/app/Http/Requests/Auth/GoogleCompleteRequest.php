<?php

declare(strict_types=1);

namespace App\Http\Requests\Auth;

use App\Services\Registration\RegistrationGate;

/** Uj fiok nyitasa Google-lel: a jelszavas regisztracioval azonos hozzajarulas es (zart betaban) meghivokod. */
final class GoogleCompleteRequest extends GoogleExchangeRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        $rules = [
            ...parent::rules(),
            'accept_terms' => ['accepted'],
            'terms_version' => ['required', 'string', 'max:32'],
            'privacy_version' => ['required', 'string', 'max:32'],
        ];

        // A kod hasznalhatosagat a ConsumeInviteCode ellenorzi a tranzakcioban.
        if (app(RegistrationGate::class)->requiresInvite()) {
            $rules['invite_code'] = ['required', 'string', 'max:64'];
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
