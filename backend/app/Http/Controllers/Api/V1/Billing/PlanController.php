<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Billing;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Config;

/** Az egyetlen elofizetesi csomag, az elofizetes oldal szamara (#19). Nyilvanos. */
final class PlanController extends Controller
{
    public function __invoke(): JsonResponse
    {
        return response()->json(['data' => [
            'name' => Config::string('billing.plan.name'),
            'price_huf' => Config::integer('billing.plan.price_huf'),
            'period_months' => Config::integer('billing.plan.period_months'),
        ]]);
    }
}
