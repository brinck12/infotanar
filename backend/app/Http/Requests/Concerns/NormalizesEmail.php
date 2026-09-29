<?php

declare(strict_types=1);

namespace App\Http\Requests\Concerns;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Az e-mail-cimeket kisbetusen taroljuk es keressuk, hogy a
 * "Pelda@x.hu" es a "pelda@x.hu" ugyanaz a fiok legyen.
 *
 * @mixin FormRequest
 */
trait NormalizesEmail
{
    protected function prepareForValidation(): void
    {
        $email = $this->input('email');

        if (is_string($email)) {
            $this->merge(['email' => mb_strtolower(trim($email))]);
        }
    }
}
