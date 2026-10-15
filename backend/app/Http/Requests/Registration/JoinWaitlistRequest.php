<?php

declare(strict_types=1);

namespace App\Http\Requests\Registration;

use App\Http\Requests\Concerns\NormalizesEmail;
use Illuminate\Foundation\Http\FormRequest;

final class JoinWaitlistRequest extends FormRequest
{
    use NormalizesEmail;

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            // Nincs "unique": a mar feliratkozott cim ugyanazt a valaszt adja (nincs felderites).
            'email' => ['required', 'string', 'email', 'max:255'],
            'note' => ['sometimes', 'nullable', 'string', 'max:255'],
        ];
    }

    public function note(): ?string
    {
        $note = $this->input('note');

        return is_string($note) && trim($note) !== '' ? trim($note) : null;
    }
}
