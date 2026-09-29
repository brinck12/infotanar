<?php

declare(strict_types=1);

namespace App\Exceptions\Access;

use App\Enums\AccessDenial;
use App\Exceptions\DomainException;
use Illuminate\Http\JsonResponse;

/** Fizetos tartalom vegrehajtasa (futtatas/beadas) jogosultsag nelkul. */
final class PremiumContentLocked extends DomainException
{
    public function __construct(public readonly AccessDenial $reason)
    {
        parent::__construct($reason->message());
    }

    public function status(): int
    {
        return $this->reason === AccessDenial::LoginRequired ? 401 : 403;
    }

    public function render(): JsonResponse
    {
        return response()->json([
            'message' => $this->getMessage(),
            'reason' => $this->reason->value,
        ], $this->status());
    }
}
