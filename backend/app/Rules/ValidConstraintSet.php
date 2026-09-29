<?php

declare(strict_types=1);

namespace App\Rules;

use App\Services\Constraints\ConstraintSet;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use InvalidArgumentException;

/** FormRequest-szabaly a feladat-szerkeszto (#49) szamara: magyar, konkret hibauzenettel. */
final class ValidConstraintSet implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if ($value === null) {
            return;
        }

        if (! is_array($value)) {
            $fail(__('constraints.invalid_shape'));

            return;
        }

        try {
            ConstraintSet::fromArray($value);
        } catch (InvalidArgumentException $e) {
            $fail($e->getMessage());
        }
    }
}
