<?php

declare(strict_types=1);

namespace App\Http\Requests\Auth;

use App\Http\Requests\Concerns\NormalizesEmail;
use App\Http\Requests\Concerns\SignupConsent;
use App\Models\InviteCode;
use Closure;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

final class RegisterRequest extends FormRequest
{
    use NormalizesEmail;
    use SignupConsent;

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            // Nincs unique szabaly: a foglalt cim nem szivaroghat ki (B13); a RegisterUser kezeli.
            'email' => ['required', 'string', 'email', 'max:255'],
            'password' => ['required', 'string', 'confirmed', Password::defaults()],
            ...$this->consentRules([
                static function (string $attribute, mixed $value, Closure $fail): void {
                    $invite = is_string($value)
                        ? InviteCode::query()->where('code', InviteCode::normalize($value))->first()
                        : null;

                    if ($invite === null || ! $invite->isUsable()) {
                        $fail(__('auth.invite.invalid'));
                    }
                },
            ]),
        ];
    }
}
