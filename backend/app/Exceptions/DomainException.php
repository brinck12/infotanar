<?php

declare(strict_types=1);

namespace App\Exceptions;

use Illuminate\Http\JsonResponse;
use RuntimeException;

/**
 * Elore lathato uzleti hiba, amelyet a kliens ertelmes (magyar) uzenetkent
 * kap meg. A Laravel a render() metodust automatikusan hasznalja.
 */
abstract class DomainException extends RuntimeException
{
    abstract public function status(): int;

    /** @return array<string, list<string>>|null */
    public function errors(): ?array
    {
        return null;
    }

    public function render(): JsonResponse
    {
        return response()->json(array_filter([
            'message' => $this->getMessage(),
            'errors' => $this->errors(),
        ], static fn (mixed $value): bool => $value !== null), $this->status());
    }
}
