<?php

declare(strict_types=1);

namespace App\Http\Requests\Auth;

use App\Http\Requests\Concerns\SignupConsent;

/** Uj fiok nyitasa Google-lel: a jelszavas regisztracioval azonos hozzajarulas es (zart betaban) meghivokod. */
final class GoogleCompleteRequest extends GoogleExchangeRequest
{
    use SignupConsent;

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [...parent::rules(), ...$this->consentRules()];
    }
}
