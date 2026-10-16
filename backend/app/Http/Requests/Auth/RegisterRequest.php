<?php

declare(strict_types=1);

namespace App\Http\Requests\Auth;

use App\Http\Requests\Concerns\NormalizesEmail;
use App\Models\InviteCode;
use App\Services\Registration\RegistrationGate;
use Closure;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

final class RegisterRequest extends FormRequest
{
    use NormalizesEmail;

    /** @return array<string, mixed> */
    public function rules(): array
    {
        $rules = [
            'name' => ['required', 'string', 'max:255'],
            // Nincs unique szabaly: a foglalt cim nem szivaroghat ki (B13); a RegisterUser kezeli.
            'email' => ['required', 'string', 'email', 'max:255'],
            'password' => ['required', 'string', 'confirmed', Password::defaults()],
            // A kliens azt a verziot kuldi, amelyet a felhasznalo tenylegesen latott (#133).
            'accept_terms' => ['accepted'],
            'terms_version' => ['required', 'string', 'max:32'],
            'privacy_version' => ['required', 'string', 'max:32'],
        ];

        // Zart beta (LAUNCH-2): meghivokod nelkul nincs regisztracio. A veglegesen
        // atomikus felhasznalast a RegisterUser vegzi; ez csak a korai, mezoszintu hiba.
        if (app(RegistrationGate::class)->requiresInvite()) {
            $rules['invite_code'] = [
                'required',
                'string',
                'max:64',
                static function (string $attribute, mixed $value, Closure $fail): void {
                    $invite = is_string($value)
                        ? InviteCode::query()->where('code', InviteCode::normalize($value))->first()
                        : null;

                    if ($invite === null || ! $invite->isUsable()) {
                        $fail(__('auth.invite.invalid'));
                    }
                },
            ];
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
