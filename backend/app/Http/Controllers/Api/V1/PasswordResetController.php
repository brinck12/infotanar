<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password as PasswordRule;

class PasswordResetController extends Controller
{
    /** Mindig ugyanazt valaszolja, hogy ne derulhessen ki, letezik-e a fiok. */
    public function forgot(Request $request): JsonResponse
    {
        $request->merge(['email' => mb_strtolower(trim((string) $request->input('email')))]);
        $request->validate(['email' => ['required', 'email']], [
            'email.required' => 'Az e-mail-cím megadása kötelező.',
            'email.email' => 'Érvénytelen e-mail-cím.',
        ]);

        Password::broker()->sendResetLink($request->only('email'));

        return response()->json([
            'message' => 'Ha létezik fiók ezzel a címmel, elküldtük a visszaállító linket.',
        ], 202);
    }

    public function reset(Request $request): JsonResponse
    {
        $request->merge(['email' => mb_strtolower(trim((string) $request->input('email')))]);
        $request->validate([
            'token' => ['required', 'string'],
            'email' => ['required', 'email'],
            'password' => ['required', 'string', 'confirmed', PasswordRule::defaults()],
        ], [
            'token.required' => 'Hiányzik a visszaállító kód.',
            'email.required' => 'Az e-mail-cím megadása kötelező.',
            'password.required' => 'A jelszó megadása kötelező.',
            'password.confirmed' => 'A két jelszó nem egyezik.',
            'password.min' => 'A jelszó legalább 8 karakter legyen.',
            'password.letters' => 'A jelszónak tartalmaznia kell legalább egy betűt.',
            'password.numbers' => 'A jelszónak tartalmaznia kell legalább egy számot.',
        ]);

        $status = Password::broker()->reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user, string $password): void {
                $user->forceFill([
                    'password' => $password,
                    'remember_token' => Str::random(60),
                ])->save();

                $user->tokens()->delete();

                event(new PasswordReset($user));
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            return response()->json([
                'message' => 'A visszaállító link érvénytelen vagy lejárt.',
                'errors' => ['token' => ['A visszaállító link érvénytelen vagy lejárt.']],
            ], 422);
        }

        return response()->json(['message' => 'A jelszavad megváltozott, jelentkezz be újra.']);
    }
}
